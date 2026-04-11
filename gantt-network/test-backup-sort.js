const fs = require('fs');
const path = require('path');

// 测试备份排序和删除逻辑
const backupDir = path.join(__dirname, 'server', 'data', 'backups');

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// 清理现有备份文件
function cleanupExistingBackups() {
    const files = fs.readdirSync(backupDir);
    files.forEach(file => {
        if (file.startsWith('pre-operation-')) {
            fs.unlinkSync(path.join(backupDir, file));
        }
    });
    console.log('清理现有备份文件完成');
}

// 创建测试备份文件
function createTestBackups() {
    console.log('开始创建测试备份文件...');
    
    // 创建10个操作前备份文件，时间从早到晚
    for (let i = 1; i <= 10; i++) {
        // 创建不同时间的备份，间隔1小时
        const date = new Date();
        date.setHours(date.getHours() - (10 - i)); // 最新的备份是i=10
        
        const timestamp = date.toISOString().replace(/:/g, '-').slice(0, 19);
        const backupFileName = `pre-operation-${timestamp}.json`;
        const backupPath = path.join(backupDir, backupFileName);
        
        // 创建一个测试文件，包含时间信息
        fs.writeFileSync(backupPath, JSON.stringify({ 
            test: 'data', 
            id: i, 
            timestamp: timestamp,
            createTime: date.toISOString()
        }));
        console.log(`创建测试备份 ${i}: ${backupFileName} (${date.toLocaleString()})`);
    }
    
    console.log('测试备份文件创建完成');
}

// 测试排序和删除逻辑
function testSortAndDelete() {
    console.log('\n开始测试排序和删除逻辑...');
    
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(file => file.startsWith('pre-operation-'));
    
    console.log(`当前备份数量: ${backupFiles.length}`);
    console.log('原始备份文件列表:');
    backupFiles.forEach(file => console.log(`  ${file}`));
    
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
    
    console.log('\n排序后备份文件列表（最新的在前）:');
    backupFiles.forEach((file, index) => {
        const timestamp = file.split('-').slice(1).join('-');
        const date = new Date(timestamp);
        console.log(`  ${index + 1}. ${file} (${date.toLocaleString()})`);
    });
    
    // 保留5个备份
    const keepCount = 5;
    if (backupFiles.length > keepCount) {
        const filesToKeep = backupFiles.slice(0, keepCount);
        const filesToDelete = backupFiles.slice(keepCount);
        
        console.log(`\n保留前${keepCount}个最新备份:`);
        filesToKeep.forEach(file => console.log(`  保留: ${file}`));
        
        console.log(`\n删除${filesToDelete.length}个最旧备份:`);
        filesToDelete.forEach(file => {
            try {
                const backupPath = path.join(backupDir, file);
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                    console.log(`  删除: ${file}`);
                }
            } catch (e) {
                console.error(`删除备份失败: ${file}`, e);
            }
        });
    }
    
    // 检查清理后的备份数量
    const remainingFiles = fs.readdirSync(backupDir).filter(file => file.startsWith('pre-operation-'));
    console.log(`\n清理后备份数量: ${remainingFiles.length}`);
    console.log('清理后备份文件列表:');
    remainingFiles.forEach(file => console.log(`  ${file}`));
    
    console.log('排序和删除逻辑测试完成');
}

// 运行测试
cleanupExistingBackups();
createTestBackups();
testSortAndDelete();
