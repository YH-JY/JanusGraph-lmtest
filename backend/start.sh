#!/bin/bash

# JanusGraph K8s Platform - Backend Startup Script

echo "=== JanusGraph K8s Platform Backend ==="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: Python3 未安装"
    exit 1
fi

# 进入后端目录
cd "$(dirname "$0")"

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装Python依赖..."
pip install -r requirements.txt

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "警告: .env 文件不存在，使用默认配置"
fi

# 启动应用
echo "启动Flask应用..."
export FLASK_ENV=development
python src/app.py