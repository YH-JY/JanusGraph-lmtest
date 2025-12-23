# JanusGraph K8s Platform

## 项目概述
一个用于实验JanusGraph图数据库的云原生资产管理平台，从k8s集群收集资产信息并构建攻击路径图谱。

## 功能特性
- 连接本地k8s集群收集云原生资产信息
- 将资产数据导入到JanusGraph图数据库
- 图数据库查询和攻击路径分析
- Web可视化界面展示图谱关系

## 技术栈
- 后端: Python Flask + kubernetes-client + gremlinpython
- 前端: React + D3.js
- 图数据库: JanusGraph

## 项目结构
```
janusgraph-k8s-platform/
├── backend/           # 后端服务
│   ├── src/          # 源代码
│   ├── config/       # 配置文件
│   └── tests/        # 测试
└── frontend/         # 前端应用
    ├── src/          # 源代码
    ├── config/       # 配置文件
    └── tests/        # 测试
```

## 部署说明
1. 确保本地已部署JanusGraph图数据库（192.168.40.129:8182）
2. 配置k8s集群访问权限
3. 启动后端服务和前端应用