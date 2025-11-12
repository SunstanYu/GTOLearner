# JSON题目上传功能使用说明

## 功能概述

新增了从JSON文件上传题目到数据库的功能，支持批量导入题目，自动去重和更新。

## 使用方法

### 1. 上传题目

```bash
# Docker方式
docker-compose exec backend python update_questions.py upload --file /app/sample_questions.json

# 直接运行方式
python update_questions.py upload --file sample_questions.json
```

### 2. 导出题目

```bash
# 导出所有题目
docker-compose exec backend python update_questions.py export --output all_questions.json

# 导出指定模式的题目
docker-compose exec backend python update_questions.py export --mode "综合练习" --output comprehensive.json
```

## JSON文件格式

### 格式1：直接数组格式
```json
[
  {
    "mode": "synthesis",
    "stage": "preflop",
    "position": "BTN",
    "stacks": [100, 100, 100, 100, 100, 100],
    "action_history": {
      "preflop": ["UTG raise 3bb", "UTG1 fold"],
      "flop": [],
      "turn": [],
      "river": []
    },
    "hole_cards": ["As", "Kh"],
    "board": [],
    "ref_solution": {
      "call": 1,
      "raise13": 2,
      "raise12": 2,
      "raise23": 3,
      "raise11": 3,
      "fold": 3
    },
    "explanation": "题目解释..."
  }
]
```

### 格式2：包含questions字段的对象格式
```json
{
  "questions": [
    {
      "mode": "synthesis",
      "stage": "preflop",
      "position": "BTN",
      "stacks": [100, 100, 100, 100, 100, 100],
      "action_history": {
        "preflop": ["UTG raise 3bb"],
        "flop": [],
        "turn": [],
        "river": []
      },
      "hole_cards": ["As", "Kh"],
      "board": [],
      "ref_solution": {
        "call": 1,
        "raise13": 2,
        "raise12": 2,
        "raise23": 3,
        "raise11": 3,
        "fold": 3
      },
      "explanation": "题目解释..."
    }
  ]
}
```

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mode | string | ✅ | 题目模式：synthesis、value、bluff |
| stage | string | ✅ | 游戏阶段：preflop、flop、turn、river |
| position | string | ✅ | 玩家位置：UTG、UTG1、MP、CO、BTN、SB、BB |
| stacks | array | ✅ | 6个玩家的筹码量 |
| action_history | object | ✅ | 行动历史，按阶段分组 |
| hole_cards | array | ✅ | 手牌，2张牌 |
| board | array | ✅ | 公共牌，0-5张 |
| ref_solution | object | ✅ | 参考解决方案，动作频率 |
| explanation | string | ✅ | 题目解释 |

## 去重逻辑

系统会根据以下字段判断题目是否重复：
- mode（模式）
- position（位置）
- hole_cards（手牌）
- board（公共牌）

如果发现重复题目，会更新现有题目而不是创建新题目。

## 错误处理

- 文件不存在：返回错误信息
- JSON格式错误：返回解析错误
- 题目格式验证失败：跳过该题目，继续处理其他题目
- 数据库操作失败：回滚所有更改

## 示例文件

项目根目录提供了 `sample_questions.json` 示例文件，包含3道不同模式的题目。

## 注意事项

1. JSON文件必须使用UTF-8编码
2. 所有必填字段都必须提供
3. ref_solution中的频率值必须是1、2、3
4. 上传过程中会显示详细的处理结果
5. 失败的题目会列出具体的错误信息
