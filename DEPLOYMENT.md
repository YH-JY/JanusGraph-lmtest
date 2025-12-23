# 部署指南

## 环境要求

### 前置条件
1. **JanusGraph图数据库** - 已部署并可访问
   - 地址: 192.168.40.129:8182
   - 确保Gremlin服务已启动

2. **Kubernetes集群** - 已配置访问权限
   - 配置文件位置: ~/.kube/config
   - 确保有足够的权限访问集群资源

3. **系统依赖**
   - Python 3.8+
   - Node.js 14+
   - npm 6+

## 快速启动

### 1. 克隆项目
```bash
cd /workspace/janusgraph-k8s-platform
```

### 2. 一键启动
```bash
chmod +x start.sh
./start.sh
```

### 3. 访问应用
- 前端界面: http://localhost:3000
- 后端API: http://localhost:5000
- 健康检查: http://localhost:5000/api/health

## 手动部署

### 后端服务部署

1. **进入后端目录**
```bash
cd backend
```

2. **创建虚拟环境**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. **安装依赖**
```bash
pip install -r requirements.txt
```

4. **配置环境变量**
```bash
# 复制并编辑 .env 文件
cp .env.example .env
# 修改配置：
# JANUSGRAPH_HOST=192.168.40.129
# JANUSGRAPH_PORT=8182
# K8S_CONFIG_PATH=~/.kube/config
```

5. **启动后端服务**
```bash
python src/app.py
```

### 前端应用部署

1. **进入前端目录**
```bash
cd frontend
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm start
```

4. **生产构建（可选）**
```bash
npm run build
```

## API接口文档

### 健康检查
- `GET /api/health` - 检查服务状态

### K8s数据收集
- `POST /api/k8s/collect` - 收集K8s集群数据
  ```json
  {
    "namespace": "optional_namespace_name"
  }
  ```

### 图数据库操作
- `POST /api/graph/build` - 构建图数据库
- `GET /api/graph/vertices` - 获取顶点数据
- `GET /api/graph/visualization` - 获取可视化数据
- `GET /api/graph/statistics` - 获取统计信息

### 攻击路径分析
- `GET /api/attack/paths` - 查找攻击路径
  ```json
  {
    "source_type": "Pod",
    "target_type": "ClusterRole",
    "max_depth": 5
  }
  ```
- `GET /api/attack/risk` - 获取风险评估

### 完整流程
- `POST /api/full-process` - 执行完整流程
  ```json
  {
    "namespace": "optional_namespace_name"
  }
  ```

## 功能说明

### 1. 仪表板
- 显示K8s资源统计信息
- 展示图数据库统计
- 风险评估概览
- 风险因素分析

### 2. K8s数据收集
- 选择命名空间收集数据
- 实时显示收集进度
- 展示收集的资源详情
- 一键构建图数据库

### 3. 图谱可视化
- D3.js力导向图展示
- 节点类型颜色区分
- 交互式缩放和拖拽
- 节点详情查看
- 命名空间过滤

### 4. 攻击路径分析
- 自定义搜索条件
- 路径风险等级评估
- 详细路径时序图
- 风险因素统计

## 故障排除

### 常见问题

1. **JanusGraph连接失败**
   - 检查JanusGraph服务是否启动
   - 确认防火墙配置
   - 验证地址和端口配置

2. **K8s权限问题**
   - 检查kubeconfig文件权限
   - 验证集群访问权限
   - 确认服务账户权限

3. **前端无法访问后端**
   - 检查后端服务状态
   - 确认端口配置
   - 验证代理设置

4. **数据收集失败**
   - 检查K8s集群连接
   - 验证命名空间权限
   - 查看后端日志

### 日志查看

**后端日志**
```bash
# 在backend目录下
tail -f logs/app.log
```

**前端日志**
- 浏览器开发者工具控制台
- React开发服务器终端输出

## 生产环境部署建议

1. **后端服务**
   - 使用WSGI服务器（Gunicorn）
   - 配置反向代理（Nginx）
   - 启用HTTPS
   - 设置日志轮转

2. **前端服务**
   - 构建生产版本
   - 使用Web服务器托管
   - 启用Gzip压缩
   - 配置缓存策略

3. **安全配置**
   - 环境变量加密
   - API访问控制
   - 审计日志
   - 定期更新依赖

## 扩展开发

### 添加新的K8s资源类型
1. 在`k8s_collector.py`中添加收集方法
2. 在`graph_builder.py`中添加顶点创建逻辑
3. 更新前端展示组件

### 添加新的攻击检测规则
1. 在`attack_path_analyzer.py`中实现检测逻辑
2. 更新风险因素分析
3. 在前端展示新的风险类型

### 自定义图谱样式
1. 修改`GraphVisualization.js`中的颜色配置
2. 添加新的节点图标
3. 调整力导向图参数