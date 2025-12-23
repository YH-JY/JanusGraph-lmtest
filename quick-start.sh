#!/bin/bash

# JanusGraph K8s Platform - Quick Start Script
# 快速启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    JanusGraph K8s Platform                     ║"
    echo "║                   云原生攻击路径分析平台                      ║"
    echo "║                      快速启动脚本                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo
}

# 检查命令是否存在
check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# 检查环境依赖
check_dependencies() {
    print_message $BLUE "🔍 检查环境依赖..."
    
    local missing_deps=()
    
    # 检查Python
    if check_command python3; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_message $GREEN "✓ Python $PYTHON_VERSION"
    else
        print_message $RED "✗ Python3 未安装"
        missing_deps+=("python3")
    fi
    
    # 检查Node.js
    if check_command node; then
        NODE_VERSION=$(node --version)
        print_message $GREEN "✓ Node.js $NODE_VERSION"
    else
        print_message $RED "✗ Node.js 未安装"
        missing_deps+=("node")
    fi
    
    # 检查npm
    if check_command npm; then
        NPM_VERSION=$(npm --version)
        print_message $GREEN "✓ npm $NPM_VERSION"
    else
        print_message $RED "✗ npm 未安装"
        missing_deps+=("npm")
    fi
    
    # 检查kubectl
    if check_command kubectl; then
        KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null || echo "Unknown")
        print_message $GREEN "✓ kubectl $KUBECTL_VERSION"
    else
        print_message $YELLOW "⚠ kubectl 未安装（可选，用于K8s集群访问）"
    fi
    
    # 检查curl
    if check_command curl; then
        print_message $GREEN "✓ curl"
    else
        print_message $RED "✗ curl 未安装"
        missing_deps+=("curl")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_message $RED "\n❌ 缺少以下依赖: ${missing_deps[*]}"
        print_message $YELLOW "请安装缺少的依赖后重新运行此脚本"
        echo
        print_message $BLUE "安装命令参考:"
        echo "Ubuntu/Debian:"
        echo "  sudo apt update"
        echo "  sudo apt install python3 python3-pip nodejs npm curl"
        echo "  curl -LO https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        echo "  chmod +x kubectl && sudo mv kubectl /usr/local/bin/"
        echo
        echo "CentOS/RHEL:"
        echo "  sudo yum install python3 python3-pip nodejs npm curl"
        echo "  curl -LO https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        echo "  chmod +x kubectl && sudo mv kubectl /usr/local/bin/"
        echo
        echo "macOS:"
        echo "  brew install python node kubectl curl"
        exit 1
    fi
    
    print_message $GREEN "✅ 所有依赖检查通过"
}

# 检查服务状态
check_services() {
    print_message $BLUE "🔍 检查服务状态..."
    
    # 检查JanusGraph
    print_message $BLUE "检查 JanusGraph (192.168.40.129:8182)..."
    if curl -s --connect-timeout 5 http://192.168.40.129:8182 >/dev/null 2>&1; then
        print_message $GREEN "✓ JanusGraph 服务正常"
    else
        print_message $RED "✗ JanusGraph 连接失败"
        print_message $YELLOW "请确保JanusGraph正在运行且可访问"
        print_message $YELLOW "地址: 192.168.40.129:8182"
        read -p "是否继续启动? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 检查K8s配置
    if [ -f ~/.kube/config ]; then
        print_message $GREEN "✓ K8s配置文件存在"
        
        # 测试K8s连接
        if kubectl cluster-info >/dev/null 2>&1; then
            print_message $GREEN "✓ K8s集群连接正常"
        else
            print_message $YELLOW "⚠ K8s集群无法连接（可能影响数据收集功能）"
        fi
    else
        print_message $YELLOW "⚠ K8s配置文件不存在 (~/.kube/config)"
        print_message $YELLOW "将无法收集K8s数据"
    fi
}

# 设置项目
setup_project() {
    print_message $BLUE "🔧 设置项目..."
    
    # 检查是否在正确目录
    if [ ! -f "package.json" ] && [ ! -f "backend/src/app.py" ]; then
        print_message $RED "❌ 请在项目根目录运行此脚本"
        exit 1
    fi
    
    print_message $GREEN "✅ 项目目录正确"
}

# 启动后端
start_backend() {
    print_message $BLUE "🚀 启动后端服务..."
    
    cd backend
    
    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        print_message $BLUE "创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    print_message $BLUE "激活虚拟环境..."
    source venv/bin/activate
    
    # 安装依赖
    print_message $BLUE "安装Python依赖..."
    if pip install -r requirements.txt -q; then
        print_message $GREEN "✅ Python依赖安装完成"
    else
        print_message $RED "❌ Python依赖安装失败"
        exit 1
    fi
    
    # 启动后端服务
    print_message $BLUE "启动Flask应用..."
    export FLASK_ENV=development
    export FLASK_PORT=5000
    
    cd src
    python app.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    # 等待后端启动
    sleep 3
    
    # 检查后端是否启动成功
    if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        print_message $GREEN "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
    else
        print_message $RED "❌ 后端服务启动失败"
        print_message $YELLOW "查看日志: tail -f backend/backend.log"
        exit 1
    fi
    
    cd ../..
}

# 启动前端
start_frontend() {
    print_message $BLUE "🚀 启动前端服务..."
    
    cd frontend
    
    # 安装依赖
    print_message $BLUE "检查Node.js依赖..."
    if [ ! -d "node_modules" ]; then
        print_message $BLUE "安装Node.js依赖..."
        if npm install --silent; then
            print_message $GREEN "✅ Node.js依赖安装完成"
        else
            print_message $RED "❌ Node.js依赖安装失败"
            exit 1
        fi
    else
        print_message $GREEN "✅ Node.js依赖已存在"
    fi
    
    # 启动前端服务
    print_message $BLUE "启动React开发服务器..."
    npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    cd ..
}

# 显示启动信息
show_startup_info() {
    print_message $GREEN "🎉 启动完成!"
    echo
    print_message $BLUE "📱 访问地址:"
    echo "   前端应用: ${GREEN}http://localhost:3000${NC}"
    echo "   后端API:  ${GREEN}http://localhost:5000${NC}"
    echo "   健康检查: ${GREEN}http://localhost:5000/api/health${NC}"
    echo
    print_message $BLUE "📋 快速使用指南:"
    echo "   1. 打开浏览器访问 http://localhost:3000"
    echo "   2. 点击'执行完整流程'开始分析"
    echo "   3. 或在各个页面手动操作"
    echo
    print_message $BLUE "📝 日志文件:"
    echo "   后端日志: backend/backend.log"
    echo "   前端日志: frontend/frontend.log"
    echo
    print_message $YELLOW "🛑 按 Ctrl+C 停止所有服务"
    echo
    
    # 捕获中断信号
    trap 'echo -e "\n🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
    
    # 等待进程
    wait
}

# 主函数
main() {
    print_header
    check_dependencies
    check_services
    setup_project
    start_backend
    start_frontend
    show_startup_info
}

# 运行主函数
main "$@"