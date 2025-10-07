# 使用Python 3.11的Debian基础镜像（包含bash）
FROM python:3.11-bullseye

# 安装开发工具
RUN apt-get update && apt-get install -y \
    bash \
    git \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8000

# 使用bash作为默认shell
CMD ["bash"]
