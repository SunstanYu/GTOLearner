# 使用Node.js 18的Debian基础镜像（包含bash）
FROM node:18-bullseye

# 安装开发工具
RUN apt-get update && apt-get install -y \
    bash \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 使用bash作为默认shell
CMD ["bash"]
