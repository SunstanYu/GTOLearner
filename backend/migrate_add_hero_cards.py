"""
数据库迁移脚本：添加hero_cards字段
使用方法：
docker-compose exec backend python migrate_add_hero_cards.py
"""

if __name__ == "__main__":
    from app.database import engine
    from sqlalchemy import text
    
    with engine.connect() as conn:
        try:
            # 使用text()包装SQL语句以支持新版本SQLAlchemy
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS hero_cards JSON"))
            conn.commit()
            print("✅ hero_cards字段添加成功！")
        except Exception as e:
            print(f"❌ 添加字段失败: {str(e)}")
            conn.rollback()
        finally:
            conn.close()

