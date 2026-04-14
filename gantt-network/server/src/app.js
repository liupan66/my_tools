const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const schedule = require('node-schedule');

const config = require('./config');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics');
const monitorMiddleware = require('./middleware/monitor');

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

function readGanttData() {
  try {
    const fs = require('fs');
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
    const fs = require('fs');
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

const JWTUtil = require('./utils/jwt');

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
  logger.info('执行定时任务');
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
