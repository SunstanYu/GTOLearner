# 生产环境部署指南

本目录包含GTOLearner项目的生产环境部署配置。

## 📁 目录结构

```
deploy/
├── docker-compose.prod.yml    # 生产环境Docker Compose配置
├── .env.production.example    # 环境变量示例文件
├── .env.production            # 环境变量文件（需要创建）
├── deploy.sh                  # 部署脚本
├── nginx/                     # Nginx配置
│   ├── nginx.conf            # Nginx配置文件
│   └── ssl/                  # SSL证书目录（需要创建）
└── README.md                 # 本文件
```

## 🚀 快速开始

### 1. 准备环境变量

```bash
cd deploy
cp .env.production.example .env.production
nano .env.production  # 编辑并填入实际值
```

### 2. 运行部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. 验证部署

访问以下地址验证服务是否正常运行：
- 前端: `http://your-server-ip`
- 后端API文档: `http://your-server-ip:8000/docs`

## 📝 环境变量说明

### 必需变量

- `NEXT_PUBLIC_API_URL`: 前端API地址
  - 使用Nginx时: `/api`
  - 不使用Nginx时: `http://your-domain.com:8000`
  
- `POSTGRES_PASSWORD`: 数据库密码（请使用强密码）

- `OPENAI_API_KEY`: OpenAI API密钥

- `DEEPSEEK_API_KEY`: DeepSeek API密钥

### 可选变量

- `POSTGRES_DB`: 数据库名称（默认: `gtolearner`）
- `POSTGRES_USER`: 数据库用户（默认: `postgres`）
- `OPENAI_MODEL`: OpenAI模型（默认: `gpt-4`）
- `DEEPSEEK_MODEL`: DeepSeek模型（默认: `deepseek-chat`）

## 🔧 常用命令

### 查看服务状态
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
# 所有服务
docker-compose -f docker-compose.prod.yml logs -f

# 特定服务
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 重启服务
```bash
docker-compose -f docker-compose.prod.yml restart
```

### 停止服务
```bash
docker-compose -f docker-compose.prod.yml down
```

### 更新代码后重新部署
```bash
# 拉取最新代码
cd ..
git pull

# 重新部署
cd deploy
./deploy.sh
```

## 🔒 SSL/HTTPS配置（可选）

### 1. 获取SSL证书

```bash
# 安装Certbot
sudo apt install certbot -y

# 获取证书（需要先停止Nginx容器）
docker-compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d your-domain.com

# 创建SSL目录并复制证书
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl
```

### 2. 启用HTTPS配置

编辑 `nginx/nginx.conf`，取消注释HTTPS server块，并注释掉HTTP server块。

### 3. 重启服务

```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## 💾 数据库备份

### 备份
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres gtolearner > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复
```bash
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres gtolearner < backup_file.sql
```

## 🐛 故障排除

### 端口被占用
```bash
# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 停止占用端口的服务
sudo systemctl stop apache2  # 如果安装了Apache
```

### 容器无法启动
```bash
# 查看详细错误
docker-compose -f docker-compose.prod.yml logs

# 检查环境变量
docker-compose -f docker-compose.prod.yml config
```

### 数据库连接问题
```bash
# 检查数据库容器
docker-compose -f docker-compose.prod.yml ps db

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs db
```

## 📚 更多信息

详细部署说明请参考项目根目录的 `DEPLOYMENT.md` 文件。

