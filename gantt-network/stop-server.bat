@echo off

rem 关闭甘特图网络版服务器

echo 关闭甘特图网络版服务器...

taskkill /F /IM node.exe 2>nul

echo 服务器已关闭

pause
