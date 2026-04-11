const fs = require('fs');
const path = require('path');

// 测试自动备份的7天周期功能
const backupDir = path.join(__dirname, 'server', 'data', 'backups');

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// 清理现有自动备份文件
function cleanupExistingAutoBackups() {
    const files = fs.readdirSync(backupDir);
    files.forEach(file => {
        if (file.startsWith('auto-')) {
            fs.unlinkSync(path.join(backupDir, file));
        }
    });
    console.log('清理现有自动备份文件完成');
}

// 创建测试自动备份文件
function createTestAutoBackups() {
    console.log('开始创建测试自动备份文件...');
    
    // 创建10个自动备份文件，模拟10天的备份
    for (let i = 1; i <= 10; i++) {
        // 创建不同日期的备份，间隔1天
        const date = new Date();
        date.setDate(date.getDate() - (10 - i)); // 最新的备份是i=10
        
        const timestamp = date.toISOString().replace(/:/g, '-').slice(0, 19);
        const backupFileName = `auto-${timestamp}.json`;
        const backupPath = path.join(backupDir, backupFileName);
        
        // 创建一个测试文件，包含时间信息
        fs.writeFileSync(backupPath, JSON.stringify({ 
            test: 'auto-backup', 
            id: i, 
            timestamp: timestamp,
            createTime: date.toISOString()
        }));
        console.log(`创建测试自动备份 ${i}: ${backupFileName} (${date.toLocaleDateString()})`);
    }
    
    console.log('测试自动备份文件创建完成');
}

// 测试自动备份的清理逻辑
function testAutoBackupCleanup() {
    console.log('\n开始测试自动备份清理逻辑...');
    
    const files = fs.readdirSync(backupDir);
    const autoBackups = files.filter(file => file.startsWith('auto-'));
    
    console.log(`当前自动备份数量: ${autoBackups.length}`);
    console.log('原始自动备份文件列表:');
    autoBackups.forEach(file => console.log(`  ${file}`));
    
    // 按时间戳排序，最新的在前
    autoBackups.sort((a, b) => {
        try {
            // 提取时间戳部分并转换为标准格式
            function parseTimestamp(fileName) {
                // 格式: auto-2026-04-11T13-20-52.json
                // 提取时间戳部分
                const timestampPart = fileName.replace('auto-', '').replace('.json', '');
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
    
    console.log('\n排序后自动备份文件列表（最新的在前）:');
    autoBackups.forEach((file, index) => {
        const timestampPart = file.replace('auto-', '').replace('.json', '');
        const isoString = timestampPart.replace(/T(\d+)-(\d+)-(\d+)/, 'T$1:$2:$3');
        const date = new Date(isoString);
        console.log(`  ${index + 1}. ${file} (${date.toLocaleDateString()})`);
    });
    
    // 保留7个备份
    const keepCount = 7;
    if (autoBackups.length > keepCount) {
        const filesToKeep = autoBackups.slice(0, keepCount);
        const filesToDelete = autoBackups.slice(keepCount);
        
        console.log(`\n保留前${keepCount}个最新自动备份:`);
        filesToKeep.forEach(file => {
            const timestampPart = file.replace('auto-', '').replace('.json', '');
            const isoString = timestampPart.replace(/T(\d+)-(\d+)-(\d+)/, 'T$1:$2:$3');
            const date = new Date(isoString);
            console.log(`  保留: ${file} (${date.toLocaleDateString()})`);
        });
        
        console.log(`\n删除${filesToDelete.length}个最旧自动备份:`);
        filesToDelete.forEach(file => {
            try {
                const backupPath = path.join(backupDir, file);
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                    const timestampPart = file.replace('auto-', '').replace('.json', '');
                    const isoString = timestampPart.replace(/T(\d+)-(\d+)-(\d+)/, 'T$1:$2:$3');
                    const date = new Date(isoString);
                    console.log(`  删除: ${file} (${date.toLocaleDateString()})`);
                }
            } catch (e) {
                console.error(`删除备份失败: ${file}`, e);
            }
        });
    }
    
    // 检查清理后的备份数量
    const remainingFiles = fs.readdirSync(backupDir).filter(file => file.startsWith('auto-'));
    console.log(`\n清理后自动备份数量: ${remainingFiles.length}`);
    console.log('清理后自动备份文件列表:');
    remainingFiles.forEach(file => {
        const timestampPart = file.replace('auto-', '').replace('.json', '');
        const isoString = timestampPart.replace(/T(\d+)-(\d+)-(\d+)/, 'T$1:$2:$3');
        const date = new Date(isoString);
        console.log(`  ${file} (${date.toLocaleDateString()})`);
    });
    
    console.log('自动备份清理逻辑测试完成');
}

// 运行测试
cleanupExistingAutoBackups();
createTestAutoBackups();
testAutoBackupCleanup();
