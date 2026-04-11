const fs = require('fs');
const path = require('path');

// 测试备份清理功能
const backupDir = path.join(__dirname, 'server', 'data', 'backups');

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// 创建测试备份文件
function createTestBackups() {
    console.log('开始创建测试备份文件...');
    
    // 创建60个操作前备份文件
    for (let i = 1; i <= 60; i++) {
        const timestamp = new Date(Date.now() - (60 - i) * 60000).toISOString().replace(/:/g, '-').slice(0, 19);
        const backupFileName = `pre-operation-${timestamp}.json`;
        const backupPath = path.join(backupDir, backupFileName);
        
        // 创建一个测试文件
        fs.writeFileSync(backupPath, JSON.stringify({ test: 'data', id: i }));
        console.log(`创建测试备份: ${backupFileName}`);
    }
    
    console.log('测试备份文件创建完成');
}

// 运行测试
createTestBackups();

// 模拟清理操作
function simulateCleanup() {
    console.log('\n开始模拟备份清理...');
    
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(file => file.startsWith('pre-operation-'));
    
    console.log(`当前备份数量: ${backupFiles.length}`);
    
    // 按时间戳排序，最新的在前
    backupFiles.sort((a, b) => {
        try {
            const dateA = new Date(a.split('-').slice(1).join('-'));
            const dateB = new Date(b.split('-').slice(1).join('-'));
            return dateB - dateA;
        } catch (e) {
            return b.localeCompare(a);
        }
    });
    
    // 保留50个备份
    const keepCount = 50;
    if (backupFiles.length > keepCount) {
        const filesToDelete = backupFiles.slice(keepCount);
        console.log(`需要删除的备份数量: ${filesToDelete.length}`);
        
        filesToDelete.forEach(file => {
            try {
                const backupPath = path.join(backupDir, file);
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                    console.log(`删除备份: ${file}`);
                }
            } catch (e) {
                console.error(`删除备份失败: ${file}`, e);
            }
        });
    }
    
    // 检查清理后的备份数量
    const remainingFiles = fs.readdirSync(backupDir).filter(file => file.startsWith('pre-operation-'));
    console.log(`清理后备份数量: ${remainingFiles.length}`);
    console.log('备份清理测试完成');
}

// 等待2秒后运行清理模拟
setTimeout(simulateCleanup, 2000);
