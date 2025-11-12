#!/bin/bash

# GTOLearner生产环境部署脚本
# 使用方法: cd deploy && ./deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署GTOLearner到生产环境..."

# 检查是否在deploy目录
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ 请在deploy目录下运行此脚本"
    echo "   使用方法: cd deploy && ./deploy.sh"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env.production ]; then
    echo "⚠️  未找到.env.production文件"
    echo "📝 从示例文件创建..."
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo "✅ 已创建.env.production，请编辑后重新运行此脚本"
        echo "   编辑命令: nano .env.production"
        exit 1
    else
        echo "❌ 未找到.env.production.example文件"
        exit 1
    fi
fi

# 加载环境变量
echo "📋 加载环境变量..."
export $(cat .env.production | grep -v '^#' | xargs)

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.prod.yml down

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 显示日志
echo "📝 显示最近日志..."
docker-compose -f docker-compose.prod.yml logs --tail=50

echo ""
echo "✅ 部署完成！"
echo ""
echo "📌 服务地址:"
echo "   - 前端（通过Nginx）: http://your-server-ip"
echo "   - 前端（直接访问）: http://your-server-ip:3000"
echo "   - 后端API: http://your-server-ip:8000"
echo "   - API文档: http://your-server-ip:8000/docs"
echo ""
echo "📋 常用命令:"
echo "   - 查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - 停止服务: docker-compose -f docker-compose.prod.yml down"
echo "   - 重启服务: docker-compose -f docker-compose.prod.yml restart"
echo "   - 查看状态: docker-compose -f docker-compose.prod.yml ps"
echo ""

