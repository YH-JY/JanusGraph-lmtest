#!/bin/bash

# JanusGraph K8s Platform - Complete Startup Script

echo "=== JanusGraph K8s Platform 启动脚本 ==="
echo

# 检查前置条件
echo "检查前置条件..."

# 检查JanusGraph连接
echo "检查JanusGraph连接 (192.168.40.129:8182)..."
if curl -s http://192.168.40.129:8182 > /dev/null; then
    echo "✓ JanusGraph连接正常"
else
    echo "✗ JanusGraph连接失败，请确保JanusGraph正在运行"
    echo "  地址: 192.168.40.129:8182"
    read -p "是否继续启动? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查K8s配置
echo "检查K8s配置..."
if [ -f ~/.kube/config ]; then
    echo "✓ K8s配置文件存在"
else
    echo "✗ K8s配置文件不存在 (~/.kube/config)"
    echo "  请确保已配置K8s集群访问权限"
    read -p "是否继续启动? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo
echo "启动后端服务..."
cd backend
chmod +x start.sh
./start.sh &
BACKEND_PID=$!

echo "等待后端服务启动..."
sleep 5

echo "启动前端服务..."
cd ../frontend
chmod +x start.sh
./start.sh &
FRONTEND_PID=$!

echo
echo "=== 启动完成 ==="
echo "后端服务: http://localhost:5000"
echo "前端服务: http://localhost:3000"
echo
echo "API文档: http://localhost:5000/api/health"
echo "Web界面: http://localhost:3000"
echo
echo "按 Ctrl+C 停止所有服务"

# 捕获中断信号
trap 'echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT

# 等待进程
wait