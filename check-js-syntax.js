const fs = require('fs');
const path = require('path');

// 读取index.html文件
const indexHtmlPath = path.join(__dirname, 'gantt-network', 'client', 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// 提取JavaScript代码
const scriptMatch = indexHtmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
if (scriptMatch) {
    scriptMatch.forEach((script, index) => {
        // 移除<script>和</script>标签
        const jsCode = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        
        // 尝试执行JavaScript代码
        try {
            eval(jsCode);
            console.log(`Script ${index + 1}: Syntax OK`);
        } catch (error) {
            console.error(`Script ${index + 1}: Syntax Error`);
            console.error(error);
        }
    });
} else {
    console.log('No script tags found in index.html');
}
