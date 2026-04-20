const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');

const config = require('./config');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const monitorMiddleware = require('./middleware/monitor');
const JWTUtil = require('./utils/jwt');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.server.corsOrigin,
    methods: ['GET', 'POST']
  }
});

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(monitorMiddleware);
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../../client')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', projectRoutes);
app.use('/api', healthRoutes);

const ganttDataPath = path.join(__dirname, config.data.ganttDataPath);
const richTextDataPath = path.join(__dirname, 'data', 'rich-text-data.json');
const backupDir = path.join(__dirname, config.data.backupDir);

const authMiddleware = require('./middleware/auth');

app.get('/api/gantt-data', authMiddleware, (req, res) => {
  try {
    const data = readGanttData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    logger.error('获取甘特图数据失败', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

app.post('/api/gantt-data', authMiddleware, (req, res) => {
  try {
    // 创建操作前备份
    createPreOperationBackup();
    
    const data = req.body;
    const success = writeGanttData(data);
    if (success) {
      res.json({
        success: true,
        message: '数据保存成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '保存数据失败'
      });
    }
  } catch (error) {
    logger.error('保存甘特图数据失败', error);
    res.status(500).json({
      success: false,
      message: '保存数据失败'
    });
  }
});

function readGanttData() {
  try {
    if (fs.existsSync(ganttDataPath)) {
      const data = fs.readFileSync(ganttDataPath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    logger.error('读取数据失败', error);
    return null;
  }
}

function writeGanttData(data) {
  try {
    const dataDir = path.dirname(ganttDataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(ganttDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    logger.error('写入数据失败', error);
    return false;
  }
}

app.get('/api/rich-text', authMiddleware, (req, res) => {
  try {
    const data = readRichTextData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    logger.error('获取富文本数据失败', error);
    res.status(500).json({
      success: false,
      message: '获取数据失败'
    });
  }
});

app.post('/api/rich-text', authMiddleware, (req, res) => {
  try {
    // 创建操作前备份
    createPreOperationBackup();
    
    const data = req.body;
    const success = writeRichTextData(data);
    if (success) {
      res.json({
        success: true,
        message: '数据保存成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '保存数据失败'
      });
    }
  } catch (error) {
    logger.error('保存富文本数据失败', error);
    res.status(500).json({
      success: false,
      message: '保存数据失败'
    });
  }
});

function readRichTextData() {
  try {
    if (fs.existsSync(richTextDataPath)) {
      const data = fs.readFileSync(richTextDataPath, 'utf8');
      return JSON.parse(data);
    }
    return { richTextContent: '' };
  } catch (error) {
    logger.error('读取富文本数据失败', error);
    return { richTextContent: '' };
  }
}

function writeRichTextData(data) {
  try {
    const dataDir = path.dirname(richTextDataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(richTextDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    logger.error('写入富文本数据失败', error);
    return false;
  }
}

// 备份相关API
app.get('/api/backups', authMiddleware, (req, res) => {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const files = fs.readdirSync(backupDir);
    const backups = files.map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const fileParts = file.split('_');
      const type = fileParts[1] || 'manual';
      const date = fileParts[2] ? fileParts[2].replace('.json', '') : stats.mtime.toISOString();
      
      return {
        fileName: file,
        type: type === 'auto' ? 'auto' : type === 'pre' ? 'pre-operation' : 'manual',
        date: new Date(date).toLocaleString(),
        size: (stats.size / 1024).toFixed(2) + ' KB'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(backups);
  } catch (error) {
    logger.error('获取备份列表失败', error);
    res.status(500).json([]);
  }
});

app.post('/api/backup', authMiddleware, (req, res) => {
  try {
    const backupData = {
      ganttData: readGanttData(),
      richTextData: readRichTextData(),
      timestamp: new Date().toISOString()
    };
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const fileName = `backup_manual_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupPath = path.join(backupDir, fileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    logger.info('手动备份创建成功', { fileName });
    
    res.json({
      success: true,
      message: '备份创建成功'
    });
  } catch (error) {
    logger.error('创建备份失败', error);
    res.status(500).json({
      success: false,
      message: '备份创建失败'
    });
  }
});

app.get('/api/backup/:fileName', authMiddleware, (req, res) => {
  try {
    const fileName = req.params.fileName;
    const backupPath = path.join(backupDir, fileName);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    res.json({
      success: true,
      data: backupData
    });
  } catch (error) {
    logger.error('获取备份失败', error);
    res.status(500).json({
      success: false,
      message: '获取备份失败'
    });
  }
});

app.delete('/api/backup/:fileName', authMiddleware, (req, res) => {
  try {
    const fileName = req.params.fileName;
    const backupPath = path.join(backupDir, fileName);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }
    
    fs.unlinkSync(backupPath);
    logger.info('备份删除成功', { fileName });
    
    res.json({
      success: true,
      message: '备份删除成功'
    });
  } catch (error) {
    logger.error('删除备份失败', error);
    res.status(500).json({
      success: false,
      message: '删除备份失败'
    });
  }
});

app.post('/api/backup/restore/:fileName', authMiddleware, (req, res) => {
  try {
    const fileName = req.params.fileName;
    const backupPath = path.join(backupDir, fileName);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // 恢复甘特图数据
    if (backupData.ganttData) {
      writeGanttData(backupData.ganttData);
    }
    
    // 恢复富文本数据
    if (backupData.richTextData) {
      writeRichTextData(backupData.richTextData);
    }
    
    logger.info('从备份恢复成功', { fileName });
    
    res.json({
      success: true,
      message: '数据恢复成功'
    });
  } catch (error) {
    logger.error('恢复备份失败', error);
    res.status(500).json({
      success: false,
      message: '恢复备份失败'
    });
  }
});

// 自动备份函数
function createAutoBackup() {
  try {
    const backupData = {
      ganttData: readGanttData(),
      richTextData: readRichTextData(),
      timestamp: new Date().toISOString()
    };
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const fileName = `backup_auto_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupPath = path.join(backupDir, fileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    logger.info('自动备份创建成功', { fileName });
    
    // 清理旧备份（保留最近10个）
    const files = fs.readdirSync(backupDir);
    if (files.length > 10) {
      const sortedFiles = files.sort((a, b) => {
        const statsA = fs.statSync(path.join(backupDir, a));
        const statsB = fs.statSync(path.join(backupDir, b));
        return statsB.mtime.getTime() - statsA.mtime.getTime();
      });
      
      sortedFiles.slice(10).forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
        logger.info('清理旧备份', { fileName: file });
      });
    }
  } catch (error) {
    logger.error('自动备份失败', error);
  }
}

// 操作前备份函数
function createPreOperationBackup() {
  try {
    const backupData = {
      ganttData: readGanttData(),
      richTextData: readRichTextData(),
      timestamp: new Date().toISOString()
    };
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const fileName = `backup_pre_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const backupPath = path.join(backupDir, fileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    logger.info('操作前备份创建成功', { fileName });
  } catch (error) {
    logger.error('操作前备份失败', error);
  }
}

io.on('connection', (socket) => {
  logger.info('新客户端连接', { socketId: socket.id });
  metrics.incrementConnections();

  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  
  if (!token) {
    logger.warn('Socket连接未提供token', { socketId: socket.id });
    socket.emit('error', { message: 'Authentication required' });
    socket.disconnect();
    metrics.decrementConnections();
    return;
  }

  const decoded = JWTUtil.verifyToken(token);
  if (!decoded) {
    logger.warn('Socket连接token无效', { socketId: socket.id });
    socket.emit('error', { message: 'Invalid token' });
    socket.disconnect();
    metrics.decrementConnections();
    return;
  }

  logger.info('Socket连接认证成功', { socketId: socket.id, userId: decoded.id });

  const initialData = readGanttData();
  if (initialData) {
    socket.emit('data', initialData);
  }

  socket.on('update', (data) => {
    logger.info('收到数据更新', { socketId: socket.id, userId: decoded.id });
    const success = writeGanttData(data);
    if (success) {
      io.emit('data', data);
    }
  });

  socket.on('disconnect', () => {
    logger.info('客户端断开连接', { socketId: socket.id, userId: decoded.id });
    metrics.decrementConnections();
  });
});

schedule.scheduleJob('0 0 * * *', () => {
  logger.info('执行定时任务 - 自动备份');
  createAutoBackup();
});

function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

const PORT = config.server.port;
server.listen(PORT, () => {
  logger.info('服务器启动', {
    port: PORT,
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://${getLocalIP()}:${PORT}`
  });
});
