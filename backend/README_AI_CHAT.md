# AI对话功能使用说明

## 功能概述

AI对话功能允许用户在与AI进行实时对话，获取关于当前德州扑克题目的专业分析和建议。AI会基于当前的对局情况（位置、手牌、公共牌、行动历史等）提供GTO（Game Theory Optimal）理论指导。

## 技术架构

### 后端实现

1. **DeepSeek生成器** (`backend/app/services/deepseek_generator.py`)
   - 封装DeepSeek API调用
   - 构建专业的德州扑克提示词
   - 处理API响应和错误

2. **API端点** (`backend/app/main.py`)
   - `POST /api/v1/chat` - AI对话接口
   - 接收题目ID和用户消息
   - 返回AI生成的回复

3. **数据模型**
   - `ChatRequest`: 用户请求数据
   - `ChatResponse`: AI回复数据

### 前端实现

1. **聊天界面** (`frontend/src/app/question/page.tsx`)
   - 实时聊天消息显示
   - 用户输入和发送
   - AI正在输入状态显示
   - 错误处理和重试机制

2. **状态管理**
   - `chatMessages`: 聊天消息列表
   - `isAiTyping`: AI正在输入状态
   - `inputMessage`: 用户输入内容

## 配置要求

### 环境变量

在 `.env` 文件中配置以下变量：

```bash
# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### Docker配置

在 `docker-compose.yml` 中已添加DeepSeek环境变量：

```yaml
environment:
  - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
  - DEEPSEEK_MODEL=${DEEPSEEK_MODEL:-deepseek-chat}
  - DEEPSEEK_BASE_URL=${DEEPSEEK_BASE_URL:-https://api.deepseek.com}
```

## 使用方法

### 1. 配置API密钥

1. 获取DeepSeek API密钥
2. 在项目根目录创建 `.env` 文件
3. 添加 `DEEPSEEK_API_KEY=your_actual_api_key`

### 2. 启动服务

```bash
# 重启后端服务以加载新配置
docker-compose restart backend
```

### 3. 使用AI对话

1. 在题目页面点击"详细解释"按钮
2. 在聊天界面输入问题
3. 点击发送按钮或按回车键
4. 等待AI回复

## API接口说明

### 请求格式

```json
POST /api/v1/chat
{
  "question_id": 123,
  "message": "我应该怎么玩这手牌？"
}
```

### 响应格式

```json
{
  "response": "基于当前情况，我建议...",
  "success": true,
  "error": null
}
```

## 功能特性

### 1. 智能上下文理解

AI会基于以下信息进行分析：
- 玩家位置（UTG, UTG1, CO, BTN, SB, BB）
- 游戏阶段（preflop, flop, turn, river）
- 手牌和公共牌
- 行动历史
- 底池大小
- 筹码深度
- 参考解决方案

### 2. 专业GTO分析

AI提供：
- 基于GTO理论的分析
- 位置优势考虑
- 筹码深度影响
- 对手行为解读
- 具体行动建议
- 原因解释

### 3. 用户体验优化

- 实时输入状态显示
- 错误处理和重试
- 响应式界面设计
- 流畅的动画效果

## 测试方法

### 1. 使用测试脚本

```bash
cd backend
python test_ai_chat.py
```

### 2. 手动测试

1. 访问 `http://localhost:3000`
2. 选择练习模式
3. 点击"详细解释"
4. 发送测试消息

## 故障排除

### 1. API密钥问题

**错误**: `DEEPSEEK_API_KEY 环境变量未设置`

**解决**: 检查 `.env` 文件中的API密钥配置

### 2. 网络连接问题

**错误**: `网络连接出现问题`

**解决**: 检查网络连接和API服务状态

### 3. 服务启动问题

**错误**: 后端服务无法启动

**解决**: 
```bash
docker-compose logs backend
docker-compose restart backend
```

## 扩展功能

### 1. 多轮对话

支持基于历史对话的上下文理解

### 2. 个性化建议

根据用户水平调整建议复杂度

### 3. 学习记录

记录用户问题和AI回复，用于学习分析

## 注意事项

1. **API费用**: DeepSeek API按使用量计费，请注意控制使用频率
2. **响应时间**: AI回复可能需要几秒钟，请耐心等待
3. **内容准确性**: AI回复仅供参考，实际游戏需要结合具体情况
4. **隐私保护**: 聊天内容不会永久存储，但会发送到DeepSeek API

## 更新日志

- **v1.0.0**: 初始版本，支持基础AI对话功能
- 集成DeepSeek API
- 实现实时聊天界面
- 添加专业德州扑克分析
