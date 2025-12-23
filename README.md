# JanusGraph K8s Platform

🚀 **云原生攻击路径分析平台** - 专为Kubernetes环境设计的资产管理和安全分析工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 14+](https://img.shields.io/badge/node-14+-green.svg)](https://nodejs.org/)

## 🌟 功能特性

- 🔄 **自动化数据收集** - 从K8s集群收集Pod、Service、Deployment等资产信息
- 📊 **图数据库构建** - 将资产关系导入JanusGraph图数据库
- 🎯 **交互式可视化** - D3.js力导向图展示云原生资产关系
- 🔍 **攻击路径分析** - 基于图算法发现潜在安全威胁路径
- ⚡ **实时风险评估** - 识别特权容器、暴露服务等安全风险
- 📈 **统计报告** - 生成详细的资产和风险统计报告

## 🛠️ 技术栈

**后端**
- Python 3.8+ & Flask
- Gremlin Python (JanusGraph客户端)
- Kubernetes Python Client
- 攻击路径分析算法

**前端**
- React 18 & Ant Design
- D3.js 数据可视化
- ECharts 图表组件

**图数据库**
- JanusGraph (192.168.40.129:8182)
- Gremlin 查询语言

## 🚀 快速开始

### 前置条件
- JanusGraph运行在 `192.168.40.129:8182`
- K8s集群配置文件 `~/.kube/config`
- Python 3.8+ 和 Node.js 14+

### 一键启动（推荐）
```bash
git clone https://github.com/YH-JY/JanusGraph-lmtest.git
cd JanusGraph-lmtest
chmod +x quick-start.sh
./quick-start.sh
```

### 手动启动
```bash
# 后端服务
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/app.py

# 前端服务（新终端）
cd frontend
npm install
npm start
```

### 访问应用
- 🌐 **Web界面**: http://localhost:3000
- 🔌 **后端API**: http://localhost:5000
- ❤️ **健康检查**: http://localhost:5000/api/health

## 📱 使用指南

### 1. 仪表板概览
- 📊 查看K8s资源统计和风险指标
- ⚡ 一键执行完整分析流程
- 📈 实时监控安全状况

### 2. K8s数据收集
- 🔍 选择命名空间（可选）
- 📥 自动收集集群资产
- 🔨 构建图数据库

### 3. 图谱可视化
- 🎨 交互式力导向图
- 🔍 节点类型颜色区分
- 🖱️ 拖拽缩放操作
- 📋 节点详情查看

### 4. 攻击路径分析
- 🎯 自定义搜索条件
- 📊 风险等级评估
- 📈 详细路径分析
- 📝 安全报告生成

## 📚 详细文档

- 📖 **完整部署指南**: [DETAILED_GUIDE.md](./DETAILED_GUIDE.md)
- 🔧 **部署说明**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 📱 **使用手册**: [USAGE.md](./USAGE.md)

## 🎯 核心功能演示

### 数据流程
1. **K8s集群扫描** → 收集所有相关资源
2. **图数据建模** → 构建节点和边的关系
3. **可视化渲染** → D3.js动态图形展示
4. **安全分析** → 基于图算法的路径发现

### 攻击路径类型
- 🏷️ **权限提升** → Pod → ClusterRole
- 🔗 **网络暴露** → Service → Pod
- 🏛️ **命名空间逃逸** → Pod跨ns访问
- 🔄 **横向移动** → 同命名空间内攻击

## 🔍 系统架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Frontend │────│   Backend API    │────│  JanusGraph DB  │
│   (React)      │    │   (Flask)       │    │  (192.168.40.129:8182) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Kubernetes     │
                       │  Cluster       │
                       └──────────────────┘
```

## 📊 项目统计

- 📁 **代码文件**: 25个
- 📝 **代码行数**: 4300+行
- 🌐 **API接口**: 8个
- 🎨 **页面组件**: 4个
- 📊 **数据模型**: 5种节点类型

## 🐛 故障排除

### 常见问题
- **JanusGraph连接失败** → 检查192.168.40.129:8182端口
- **K8s权限问题** → 验证~/.kube/config文件
- **前端无法访问** → 检查代理设置和端口冲突

详细解决方案请参考 [DETAILED_GUIDE.md](./DETAILED_GUIDE.md#故障排除)

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 作者

**YH-JY** - [GitHub Profile](https://github.com/YH-JY)

## 🙏 致谢

- [JanusGraph](https://janusgraph.org/) - 图数据库支持
- [D3.js](https://d3js.org/) - 数据可视化
- [Ant Design](https://ant.design/) - UI组件库
- [React](https://reactjs.org/) - 前端框架

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

📧 联系方式: [提交Issue](https://github.com/YH-JY/JanusGraph-lmtest/issues)