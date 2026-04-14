const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 数据文件路径
const dataFilePath = path.join(__dirname, 'data', 'gantt-data.json');
const backupDir = path.join(__dirname, 'data', 'backups');

// 确保数据目录和备份目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// 备份数据
function backupData(backupType = 'auto') {
    try {
        if (fs.existsSync(dataFilePath)) {
            const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
            const backupFileName = `${backupType}-${timestamp}.json`;
            const backupPath = path.join(backupDir, backupFileName);
            
            fs.copyFileSync(dataFilePath, backupPath);
            console.log(`备份成功: ${backupFileName}`);
            
            // 清理旧备份
            cleanupBackups(backupType);
            
            return backupFileName;
        }
    } catch (error) {
        console.error('备份失败:', error);
    }
    return null;
}

// 清理旧备份
function cleanupBackups(backupType) {
    try {
        const files = fs.readdirSync(backupDir);
        const backupFiles = files.filter(file => file.startsWith(`${backupType}-`));
        
        // 按时间戳排序，最新的在前
        backupFiles.sort((a, b) => {
            try {
                // 提取时间戳部分并转换为标准格式
                function parseTimestamp(fileName) {
                    // 格式: pre-operation-2026-04-11T13-20-52.json
                    // 提取时间戳部分
                    const timestampPart = fileName.replace('pre-operation-', '').replace('.json', '');
                    // 将时间部分的'-'替换为':'
                    const isoString = timestampPart.replace(/T(\d+)-(\d+)-(\d+)/, 'T$1:$2:$3');
                    return new Date(isoString);
                }
                
                const dateA = parseTimestamp(a);
                const dateB = parseTimestamp(b);
                
                console.log(`比较: ${a} (${dateA.getTime()}) vs ${b} (${dateB.getTime()})`);
                
                // 按时间戳降序排序（最新的在前）
                return dateB.getTime() - dateA.getTime();
            } catch (e) {
                console.error('日期解析失败:', e);
                // 如果日期解析失败，使用文件名倒序排序
                return b.localeCompare(a);
            }
        });
        
        // 保留指定数量的备份
        const keepCount = backupType === 'auto' ? 7 : 50; // 操作前备份保留50个
        console.log(`当前${backupType}备份数量: ${backupFiles.length}, 保留数量: ${keepCount}`);
        
        if (backupFiles.length > keepCount) {
            const filesToDelete = backupFiles.slice(keepCount);
            console.log(`需要删除的备份数量: ${filesToDelete.length}`);
            
            // 删除多余的旧备份
            filesToDelete.forEach(file => {
                try {
                    const backupPath = path.join(backupDir, file);
                    if (fs.existsSync(backupPath)) {
                        fs.unlinkSync(backupPath);
                        console.log(`清理旧备份: ${file}`);
                    } else {
                        console.log(`备份文件不存在: ${file}`);
                    }
                } catch (e) {
                    console.error(`删除备份文件失败: ${file}`, e);
                }
            });
        }
    } catch (error) {
        console.error('清理备份失败:', error);
    }
}

// 读取数据
function readData() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('读取数据失败:', error);
        return null;
    }
}

// 写入数据
function writeData(data) {
    try {
        // 操作前备份
        backupData('pre-operation');
        
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入数据失败:', error);
        return false;
    }
}

// 从备份恢复
function restoreFromBackup(backupFileName) {
    try {
        const backupPath = path.join(backupDir, backupFileName);
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, dataFilePath);
            console.log(`从备份恢复成功: ${backupFileName}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('恢复失败:', error);
        return false;
    }
}

// 获取备份列表
function getBackupList() {
    try {
        const files = fs.readdirSync(backupDir);
        const backupFiles = files.filter(file => file.endsWith('.json'));
        
        // 按时间戳排序，最新的在前
        backupFiles.sort((a, b) => {
            return new Date(b.split('-').slice(1).join('-')) - new Date(a.split('-').slice(1).join('-'));
        });
        
        return backupFiles.map(file => {
            const parts = file.split('-');
            const type = parts[0];
            const timestamp = parts.slice(1).join('-');
            const date = new Date(timestamp);
            
            return {
                fileName: file,
                type: type,
                date: date.toLocaleString(),
                size: (fs.statSync(path.join(backupDir, file)).size / 1024).toFixed(2) + ' KB'
            };
        });
    } catch (error) {
        console.error('获取备份列表失败:', error);
        return [];
    }
}

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client')));

// 数据API
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data || {});
});

app.post('/api/data', express.json(), (req, res) => {
    const success = writeData(req.body);
    res.json({ success });
});

// 备份API
app.get('/api/backups', (req, res) => {
    const backups = getBackupList();
    res.json(backups);
});

app.post('/api/backup', (req, res) => {
    const backupFileName = backupData('manual');
    res.json({ success: !!backupFileName, fileName: backupFileName });
});

app.post('/api/restore', express.json(), (req, res) => {
    const { fileName } = req.body;
    const success = restoreFromBackup(fileName);
    res.json({ success });
});

app.delete('/api/backup/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const backupPath = path.join(backupDir, fileName);
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
            res.json({ success: true });
        } else {
            res.json({ success: false, message: '备份文件不存在' });
        }
    } catch (error) {
        console.error('删除备份失败:', error);
        res.json({ success: false, message: '删除失败' });
    }
});

// Socket.io 连接
io.on('connection', (socket) => {
    console.log('新客户端连接:', socket.id);
    
    // 发送初始数据
    const initialData = readData();
    if (initialData) {
        socket.emit('data', initialData);
    }
    
    // 接收数据更新
    socket.on('update', (data) => {
        console.log('收到数据更新');
        const success = writeData(data);
        if (success) {
            // 广播给所有客户端
            io.emit('data', data);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('客户端断开连接:', socket.id);
    });
});

// 定时备份（每天凌晨0点）
schedule.scheduleJob('0 0 * * *', () => {
    console.log('执行定时备份');
    backupData('auto');
});

// 启动服务器
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`局域网访问地址: http://${getLocalIP()}:${PORT}`);
});

// 获取本地IP地址
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
