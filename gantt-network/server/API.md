# 甘特图网络版 API 文档

## 概述
本文档描述了甘特图网络版的后端API接口。

## 初始化
```bash
# 安装依赖
npm install

# 初始化默认管理员账号
node src/init.js

# 启动服务器
npm start
```

默认管理员账号：
- 用户名: admin
- 密码: admin123

## 认证接口

### 用户注册
- **接口: POST /api/auth/register
- **描述**: 注册新用户
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string (optional)"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "data": {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "username": "username",
        "email": "email",
        "role": "role",
        "permissions": ["read", "write"]
      }
    }
  }
  ```

### 用户登录
- **接口**: POST /api/auth/login
- **描述**: 用户登录获取Token
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "jwt_token",
      "user": { ... }
    }
  }
  ```

### 获取当前用户信息
- **接口**: GET /api/auth/profile
- **认证**: 需要 Bearer Token
- **描述**: 获取当前登录用户的信息

## 用户管理接口 (需要admin或manager角色)

### 获取所有用户
- **接口**: GET /api/users
- **认证**: 需要 Bearer Token
- **权限**: admin, manager

### 获取单个用户
- **接口**: GET /api/users/:id
- **认证**: 需要 Bearer Token
- **权限**: admin, manager

### 创建用户
- **接口**: POST /api/users
- **认证**: 需要 Bearer Token
- **权限**: admin
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string",
    "role": "user|manager|admin",
    "permissions": ["read", "write", "delete", "admin"]
  }
  ```

### 更新用户
- **接口**: PUT /api/users/:id
- **认证**: 需要 Bearer Token
- **权限**: admin

### 删除用户
- **接口**: DELETE /api/users/:id
- **认证**: 需要 Bearer Token
- **权限**: admin

## 项目和甘特图数据接口

### 获取甘特图数据
- **接口**: GET /api/gantt-data
- **认证**: 需要 Bearer Token
- **权限**: read

### 保存甘特图数据
- **接口**: POST /api/gantt-data
- **认证**: 需要 Bearer Token
- **权限**: write
- **请求体**: 甘特图数据对象

### 获取所有项目
- **接口**: GET /api/projects
- **认证**: 需要 Bearer Token
- **权限**: read

### 创建项目
- **接口**: POST /api/projects
- **认证**: 需要 Bearer Token
- **权限**: write
- **请求体**:
  ```json
  {
    "name": "项目名称",
    "color": "#3498db"
  }
  ```

### 更新项目
- **接口**: PUT /api/projects/:oldName
- **认证**: 需要 Bearer Token
- **权限**: write
- **请求体**:
  ```json
  {
    "newName": "新名称",
    "color": "#color"
  }
  ```

### 删除项目
- **接口**: DELETE /api/projects/:name
- **认证**: 需要 Bearer Token
- **权限**: delete

## 健康检查和监控接口

### 健康检查
- **接口**: GET /api/health
- **认证**: 不需要
- **描述**: 检查服务健康状态

### 获取监控指标
- **接口**: GET /api/metrics
- **认证**: 需要 Bearer Token
- **权限**: admin, manager
- **描述**: 获取系统监控数据，包括：
  - 运行时间
  - 请求统计（总数、成功数、错误数）
  - 响应时间（平均、最小、最大）
  - 活跃连接数
  - 系统信息（CPU、内存等）

### 重置监控指标
- **接口**: POST /api/metrics/reset
- **认证**: 需要 Bearer Token
- **权限**: admin

## 角色和权限说明

### 角色
- **admin**: 管理员，拥有所有权限
- **manager**: 项目经理，可以管理用户和项目
- **user**: 普通用户，只能读取和编辑自己的任务

### 权限
- **read**: 读取权限
- **write**: 写入权限
- **delete**: 删除权限
- **admin**: 管理员权限

## 使用示例

### 1. 登录获取Token
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. 使用Token访问API
```bash
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 获取监控指标
```bash
curl http://localhost:8000/api/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```
