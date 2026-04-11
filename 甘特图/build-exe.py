import os
import json
import subprocess
import shutil
import sys

def main():
    # ==================== 配置区域 ====================
    APP_NAME = "gantt-app"          # 应用名称
    HTML_FILE = "甘特图.html"        # HTML文件名
    APP_TITLE = "甘特图"             # 窗口标题
    VERSION_FILE = "version.json"    # 版本文件名
    # =================================================
    
    print("=" * 60)
    print(f"开始打包: {APP_TITLE}")
    print("=" * 60)
    
    # 1. 关闭正在运行的exe
    print("\n[步骤1] 检查并关闭正在运行的exe...")
    try:
        result = subprocess.run(
            ["taskkill", "/f", "/im", f"{APP_NAME}.exe"],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✓ 已关闭正在运行的exe进程")
        else:
            print("✓ 没有正在运行的exe进程")
    except Exception as e:
        print(f"! 检查进程时出错: {e}")
    
    # 2. 读取或创建版本文件
    print(f"\n[步骤2] 读取版本信息...")
    if os.path.exists(VERSION_FILE):
        with open(VERSION_FILE, 'r', encoding='utf-8') as f:
            version = json.load(f)
        print(f"✓ 当前版本: v{version['major']}.{version['minor']}.{version['patch']}")
    else:
        version = {"major": 1, "minor": 0, "patch": 0}
        print(f"✓ 创建初始版本: v{version['major']}.{version['minor']}.{version['patch']}")
    
    version_string = f"{version['major']}.{version['minor']}.{version['patch']}"
    
    # 3. 检查必要文件是否存在
    print(f"\n[步骤3] 检查必要文件...")
    if not os.path.exists(HTML_FILE):
        print(f"✗ 错误: 找不到HTML文件 '{HTML_FILE}'")
        sys.exit(1)
    print(f"✓ HTML文件存在: {HTML_FILE}")
    
    if not os.path.exists(f"{APP_NAME}.py"):
        print(f"✗ 错误: 找不到Python文件 '{APP_NAME}.py'")
        sys.exit(1)
    print(f"✓ Python文件存在: {APP_NAME}.py")
    
    # 4. 执行打包命令
    print(f"\n[步骤4] 执行打包命令...")
    print(f"  输出文件名: {APP_NAME}-v{version_string}.exe")
    
    cmd = [
        "pyinstaller",
        "--onefile",
        "--windowed",
        f"--add-data={HTML_FILE};.",
        f"--name={APP_NAME}-v{version_string}",
        f"{APP_NAME}.py"
    ]
    
    print(f"  执行命令: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ 打包失败:")
        print(result.stderr)
        sys.exit(1)
    
    print("✓ 打包成功!")
    
    # 5. 创建data目录（如果不存在）
    print(f"\n[步骤5] 检查data目录...")
    data_dir = os.path.join("dist", "data")
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        # 创建.gitkeep文件，确保空目录可以被git追踪
        with open(os.path.join(data_dir, ".gitkeep"), 'w') as f:
            f.write("")
        print(f"✓ 创建data目录: {data_dir}")
    else:
        print(f"✓ data目录已存在，保留现有数据")
        
        # 列出现有数据文件
        data_files = [f for f in os.listdir(data_dir) if f != ".gitkeep"]
        if data_files:
            print(f"  现有数据文件: {', '.join(data_files)}")
    
    # 6. 更新版本号
    print(f"\n[步骤6] 更新版本号...")
    version['patch'] += 1
    with open(VERSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(version, f, indent=2, ensure_ascii=False)
    
    new_version_string = f"{version['major']}.{version['minor']}.{version['patch']}"
    print(f"✓ 版本号已更新: v{version_string} -> v{new_version_string}")
    
    # 7. 输出结果
    print("\n" + "=" * 60)
    print("打包完成!")
    print("=" * 60)
    print(f"输出文件: dist/{APP_NAME}-v{version_string}.exe")
    print(f"数据目录: dist/data/")
    print(f"下次打包版本: v{new_version_string}")
    print("=" * 60)
    
    # 8. 列出dist目录内容
    print("\ndist目录内容:")
    for item in os.listdir("dist"):
        item_path = os.path.join("dist", item)
        if os.path.isdir(item_path):
            print(f"  📁 {item}/")
            for sub_item in os.listdir(item_path):
                print(f"      {sub_item}")
        else:
            size = os.path.getsize(item_path)
            size_mb = size / (1024 * 1024)
            print(f"  📄 {item} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    main()
