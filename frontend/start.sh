#!/bin/bash

# JanusGraph K8s Platform - Frontend Startup Script

echo "=== JanusGraph K8s Platform Frontend ==="

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装"
    exit 1
fi

# 进入前端目录
cd "$(dirname "$0")"

# 安装依赖
echo "安装Node.js依赖..."
npm install

# 启动开发服务器
echo "启动React开发服务器..."
npm start