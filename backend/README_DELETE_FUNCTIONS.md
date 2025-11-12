# 题目删除功能使用说明

## 功能概述

新增了题目删除功能，支持软删除、硬删除和恢复操作，可以按模式删除或删除所有题目。

## 删除类型

### 1. 软删除 (Soft Delete)
- 设置 `is_active = False`
- 题目数据保留在数据库中
- 可以通过恢复功能重新激活
- **推荐使用**，更安全

### 2. 硬删除 (Hard Delete)
- 从数据库中完全删除记录
- 无法恢复
- 谨慎使用

### 3. 恢复 (Restore)
- 恢复被软删除的题目
- 设置 `is_active = True`

## 使用方法

### 1. 软删除题目

```bash
# 删除所有题目
docker-compose exec backend python update_questions.py delete --confirm

# 删除指定模式的题目
docker-compose exec backend python update_questions.py delete --mode "synthesis" --confirm
docker-compose exec backend python update_questions.py delete --mode "value" --confirm
docker-compose exec backend python update_questions.py delete --mode "bluff" --confirm
```

### 2. 硬删除题目

```bash
# 硬删除所有题目
docker-compose exec backend python update_questions.py hard-delete --confirm

# 硬删除指定模式的题目
docker-compose exec backend python update_questions.py hard-delete --mode "synthesis" --confirm
```

### 3. 恢复题目

```bash
# 恢复所有被删除的题目
docker-compose exec backend python update_questions.py restore

# 恢复指定模式的题目
docker-compose exec backend python update_questions.py restore --mode "synthesis"
```

## 安全机制

### 确认机制
- 所有删除操作都需要 `--confirm` 参数
- 防止误操作

### 事务回滚
- 如果删除过程中出现错误，会自动回滚
- 保证数据一致性

### 详细日志
- 显示删除/恢复的题目数量
- 显示操作结果和错误信息

## 使用示例

### 场景1：清理测试数据
```bash
# 查看当前题目统计
docker-compose exec backend python update_questions.py stats

# 删除所有题目
docker-compose exec backend python update_questions.py delete --confirm

# 重新上传题目
docker-compose exec backend python update_questions.py upload --file /app/sample_questions.json
```

### 场景2：删除特定模式
```bash
# 只删除bluff模式的题目
docker-compose exec backend python update_questions.py delete --mode "bluff" --confirm

# 查看删除后的统计
docker-compose exec backend python update_questions.py stats
```

### 场景3：恢复误删的题目
```bash
# 恢复被软删除的题目
docker-compose exec backend python update_questions.py restore

# 查看恢复后的统计
docker-compose exec backend python update_questions.py stats
```

## 注意事项

1. **软删除优先**：建议使用软删除，可以随时恢复
2. **硬删除谨慎**：硬删除无法恢复，请谨慎使用
3. **确认参数**：删除操作必须添加 `--confirm` 参数
4. **备份数据**：重要数据建议先导出备份
5. **测试环境**：建议先在测试环境中验证删除功能

## 错误处理

- 如果删除过程中出现错误，会自动回滚事务
- 显示详细的错误信息
- 不会影响其他题目数据

## 相关命令

- `stats` - 查看题目统计
- `export` - 导出题目备份
- `upload` - 上传新题目
- `delete` - 软删除题目
- `hard-delete` - 硬删除题目
- `restore` - 恢复题目
