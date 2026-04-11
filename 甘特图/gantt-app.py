import webview
import os
import sys
import json
import threading

# 获取应用程序的根目录
if getattr(sys, 'frozen', False):
    # 当应用被打包时
    app_dir = os.path.dirname(sys.executable)
else:
    # 当应用未被打包时
    app_dir = os.path.dirname(os.path.abspath(__file__))

# 确保data目录存在
data_dir = os.path.join(app_dir, 'data')
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

# 数据文件路径
data_file_path = os.path.join(data_dir, 'ganttData.json')

class Api:
    """
    这个类提供了JavaScript可以调用的API
    """
    def saveData(self, data):
        """保存数据到本地文件"""
        try:
            with open(data_file_path, 'w', encoding='utf-8') as f:
                f.write(data)
            return {'success': True, 'message': '数据保存成功'}
        except Exception as e:
            return {'success': False, 'message': str(e)}
    
    def loadData(self):
        """从本地文件加载数据"""
        try:
            if os.path.exists(data_file_path):
                with open(data_file_path, 'r', encoding='utf-8') as f:
                    data = f.read()
                return {'success': True, 'data': data}
            else:
                return {'success': False, 'message': '数据文件不存在'}
        except Exception as e:
            return {'success': False, 'message': str(e)}
    
    def existsData(self):
        """检查数据文件是否存在"""
        return {'success': True, 'exists': os.path.exists(data_file_path)}

def get_html_path():
    """获取HTML文件的路径"""
    if getattr(sys, 'frozen', False):
        # 当应用被打包时，从临时目录获取HTML文件
        base_path = sys._MEIPASS
    else:
        # 当应用未被打包时，从当前目录获取HTML文件
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    return os.path.join(base_path, '甘特图.html')

if __name__ == '__main__':
    # 创建API实例
    api = Api()
    
    # 创建窗口
    html_path = get_html_path()
    window = webview.create_window('甘特图', html_path, js_api=api, width=1200, height=800)
    
    # 启动应用
    webview.start()
