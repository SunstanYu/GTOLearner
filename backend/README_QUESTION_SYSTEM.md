# 题目更新系统使用说明

## 系统架构

### 数据库存储
- 使用PostgreSQL存储题目信息
- 支持题目版本管理和软删除
- 记录题目生成日志

### ChatGPT集成
- 支持自定义提示词
- 自动验证题目格式
- 错误处理和重试机制

## 环境配置

### 1. 环境变量设置
复制 `env.example` 为 `.env` 并配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：
```bash
# ChatGPT API配置
OPENAI_API_KEY=your_actual_api_key
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1

# 数据库配置
DATABASE_URL=postgresql://postgres:password@postgres:5432/gtolearner
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

## 使用方法

### 命令行工具

#### 1. 初始化数据库
```bash
python update_questions.py init
```

#### 2. 测试ChatGPT连接
```bash
python update_questions.py test
```

#### 3. 生成题目
```bash
# 生成20道综合练习题
python update_questions.py generate --mode 综合练习 --count 20

# 生成10道价值练习题
python update_questions.py generate --mode 价值练习 --count 10

# 使用自定义提示词
python update_questions.py generate --mode Bluff练习 --count 15 --prompt custom_prompt.txt
```

#### 4. 查看统计信息
```bash
python update_questions.py stats
docker-compose exec backend python update_questions.py stats   
```

### API接口

#### 1. 生成题目
```bash
curl -X POST "http://localhost:8000/api/v1/admin/generate-questions" \
  -H "Content-Type: application/json" \
  -d '{"mode": "综合练习", "count": 20}'
```

#### 2. 获取统计
```bash
curl "http://localhost:8000/api/v1/admin/stats"
```

#### 3. 获取所有题目
```bash
curl "http://localhost:8000/api/v1/admin/questions?mode=综合练习&limit=50"
```

## 题目格式

### 数据库表结构
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    mode VARCHAR(50) NOT NULL,
    stage VARCHAR(20) NOT NULL,
    position VARCHAR(10) NOT NULL,
    stacks JSON NOT NULL,
    action_history JSON NOT NULL,
    hole_cards JSON NOT NULL,
    board JSON NOT NULL,
    ref_solution JSON NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    source VARCHAR(50) DEFAULT 'manual',
    version VARCHAR(20) DEFAULT '1.0',
    difficulty VARCHAR(20) DEFAULT 'medium'
);
```

### 题目JSON格式
```json
{
    "mode": "综合练习",
    "stage": "preflop",
    "position": "BTN",
    "stacks": [100, 95, 110, 100, 50, 25],
    "action_history": {
        "preflop": ["UTG raise 3", "UTG1 fold", "CO call"],
        "flop": [],
        "turn": [],
        "river": []
    },
    "hole_cards": ["As", "Kh"],
    "board": ["5c", "7h", "2d"],
    "ref_solution": {
        "call": 1,
        "raise13": 2,
        "raise12": 2,
        "raise23": 3,
        "raise11": 3,
        "fold": 3
    },
    "explanation": "详细解释内容..."
}
```

## 自定义提示词

创建 `custom_prompt.txt` 文件：
```
请生成20道德州扑克GTO练习题，要求：

1. 重点训练翻牌前的3bet决策
2. 包含不同位置的场景
3. 解释要详细说明GTO原理
4. 返回JSON数组格式

...
```

## 错误处理

### 常见问题

1. **API密钥错误**
   - 检查 `OPENAI_API_KEY` 是否正确
   - 确认API密钥有足够额度

2. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确认PostgreSQL服务运行正常

3. **JSON解析错误**
   - ChatGPT返回格式不正确
   - 检查提示词是否明确要求JSON格式

4. **题目验证失败**
   - 检查题目字段是否完整
   - 确认数据类型正确

## 监控和日志

### 生成日志
所有题目生成操作都会记录在 `question_generation_logs` 表中：
- 生成批次ID
- 成功/失败数量
- 使用的提示词
- ChatGPT响应
- 错误信息

### 统计信息
```bash
python update_questions.py stats
```

显示：
- 总题目数
- 按模式分布
- 按阶段分布
- 按来源分布

## 最佳实践

1. **批量生成**：建议每次生成20-50道题目
2. **质量检查**：定期检查生成的题目质量
3. **版本管理**：使用不同版本号管理题目更新
4. **备份数据**：定期备份数据库
5. **监控API使用**：监控ChatGPT API使用量和费用
