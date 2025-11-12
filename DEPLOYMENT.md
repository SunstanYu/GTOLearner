# AWS部署指南

本指南将帮助您将GTOLearner项目部署到AWS EC2服务器上。

> **注意**: 生产环境配置文件位于 `deploy/` 目录，开发环境配置在项目根目录。

## 📁 项目结构说明

- **开发环境** (项目根目录):
  - `docker-compose.yml` - 开发环境配置（热重载、卷挂载）
  - `frontend/Dockerfile` - 开发环境前端镜像
  - `backend/Dockerfile` - 开发环境后端镜像

- **生产环境** (`deploy/` 目录):
  - `docker-compose.prod.yml` - 生产环境配置（优化、无热重载）
  - `deploy.sh` - 一键部署脚本
  - `nginx/` - Nginx反向代理配置
  - `.env.production` - 生产环境变量（需要创建）

## 步骤1: 准备AWS EC2实例

### 1.1 创建EC2实例

1. 登录AWS控制台，进入EC2服务
2. 启动新实例，推荐配置：
   - **实例类型**: t3.medium 或更高（至少2GB RAM）
   - **操作系统**: Ubuntu 22.04 LTS
   - **存储**: 至少20GB
   - **安全组**: 开放以下端口
     - 22 (SSH)
     - 80 (HTTP)
     - 443 (HTTPS)
     - 3000 (前端，可选)
     - 8000 (后端，可选)

### 1.2 连接到EC2实例

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 1.3 安装必要软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将当前用户添加到docker组（避免每次使用sudo）
sudo usermod -aG docker ubuntu

# 重新登录以应用组更改
exit
# 然后重新SSH连接
```

## 步骤2: 上传项目代码

### 方法1: 使用Git（推荐）

```bash
# 在EC2实例上
cd ~
git clone https://github.com/your-username/GTOLearner.git
cd GTOLearner
```

### 方法2: 使用SCP

```bash
# 在本地机器上
scp -i your-key.pem -r /path/to/GTOLearner ubuntu@your-ec2-ip:~/
```

## 步骤3: 配置生产环境

```bash
# 进入deploy目录
cd ~/GTOLearner/deploy

# 复制环境变量示例文件
cp .env.production.example .env.production

# 编辑环境变量文件
nano .env.production
```

填入以下信息：
- `NEXT_PUBLIC_API_URL`: 如果使用Nginx，设置为 `/api`；否则设置为 `http://your-domain.com:8000`
- `POSTGRES_PASSWORD`: 设置强密码
- `OPENAI_API_KEY`: 您的OpenAI API密钥
- `DEEPSEEK_API_KEY`: 您的DeepSeek API密钥

## 步骤4: 配置Nginx（可选但推荐）

如果您有域名并想使用HTTPS，请参考 `deploy/README.md` 中的SSL配置说明。

## 步骤5: 部署

### 方法1: 使用部署脚本（推荐）

```bash
cd ~/GTOLearner/deploy
chmod +x deploy.sh
./deploy.sh
```

### 方法2: 手动部署

```bash
cd ~/GTOLearner/deploy

# 加载环境变量
export $(cat .env.production | grep -v '^#' | xargs)

# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 步骤6: 验证部署

1. **检查服务状态**:
   ```bash
   cd ~/GTOLearner/deploy
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **测试前端**: 访问 `http://your-ec2-ip` 或 `https://your-domain.com`

3. **测试后端API**: 访问 `http://your-ec2-ip:8000/docs` 查看API文档

## 步骤7: 设置自动启动（可选）

创建systemd服务以确保容器在服务器重启后自动启动：

```bash
sudo nano /etc/systemd/system/gtolearner.service
```

添加以下内容：

```ini
[Unit]
Description=GTOLearner Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/GTOLearner/deploy
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable gtolearner.service
sudo systemctl start gtolearner.service
```

## 常用命令

### 查看日志
```bash
cd ~/GTOLearner/deploy

# 所有服务
docker-compose -f docker-compose.prod.yml logs -f

# 特定服务
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 重启服务
```bash
cd ~/GTOLearner/deploy
docker-compose -f docker-compose.prod.yml restart
```

### 停止服务
```bash
cd ~/GTOLearner/deploy
docker-compose -f docker-compose.prod.yml down
```

### 更新代码
```bash
# 拉取最新代码
cd ~/GTOLearner
git pull

# 重新部署
cd deploy
./deploy.sh
```

### 备份数据库
```bash
cd ~/GTOLearner/deploy
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres gtolearner > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复数据库
```bash
cd ~/GTOLearner/deploy
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres gtolearner < backup_file.sql
```

## 故障排除

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
cd ~/GTOLearner/deploy

# 查看详细错误
docker-compose -f docker-compose.prod.yml logs

# 检查环境变量
docker-compose -f docker-compose.prod.yml config
```

### 数据库连接问题
```bash
cd ~/GTOLearner/deploy

# 检查数据库容器
docker-compose -f docker-compose.prod.yml ps db

# 查看数据库日志
docker-compose -f docker-compose.prod.yml logs db
```

### 内存不足
如果遇到内存不足的问题，可以：
1. 升级EC2实例类型
2. 减少后端worker数量（编辑 `backend/Dockerfile.prod` 中的 `--workers` 参数）

## 安全建议

1. **防火墙配置**: 只开放必要的端口
2. **定期更新**: 保持系统和Docker镜像更新
3. **备份**: 定期备份数据库
4. **监控**: 设置CloudWatch监控
5. **日志**: 定期清理日志文件

## 性能优化

1. **使用CDN**: 为静态资源配置CloudFront
2. **数据库优化**: 考虑使用RDS替代容器数据库
3. **缓存**: 使用ElastiCache替代容器Redis
4. **负载均衡**: 使用Application Load Balancer

## 更多信息

- 生产环境详细配置: 查看 `deploy/README.md`
- 开发环境使用: 在项目根目录运行 `docker-compose up`

## 支持

如有问题，请查看项目文档或提交Issue。

