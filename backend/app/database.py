"""
数据库配置和表结构定义
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, JSON, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@postgres:5432/gtolearner")

# 创建数据库引擎
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Question(Base):
    """题目表"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    mode = Column(String(50), nullable=False, index=True)  # 综合练习, 价值练习, bluff练习
    stage = Column(String(20), nullable=False)  # preflop, flop, turn, river
    position = Column(String(10), nullable=False)  # UTG, UTG1, CO, BTN, SB, BB
    stacks = Column(JSON, nullable=False)  # [100, 95, 110, 100, 50, 25]
    action_history = Column(JSON, nullable=False)  # {"preflop": [...], "flop": [...], ...}
    hole_cards = Column(JSON, nullable=False)  # ["As", "Kh"]
    board = Column(JSON, nullable=False)  # ["5c", "7h", "2d"]
    ref_solution = Column(JSON, nullable=False)  # {"call": 1, "raise13": 2, ...}
    explanation = Column(Text, nullable=False)
    pot = Column(Integer, nullable=False)  # 底池大小
    hero_cards = Column(JSON, nullable=True)  # {"UTG1": ["Ad", "Kd"], "BB": ["7c", "6c"]} - 其他玩家的已知手牌
    
    # 元数据
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # 题目来源和版本
    source = Column(String(50), default="manual")  # manual, chatgpt, solver
    version = Column(String(20), default="1.0")
    difficulty = Column(String(20), default="medium")  # easy, medium, hard

class QuestionGenerationLog(Base):
    """题目生成日志表"""
    __tablename__ = "question_generation_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    generation_id = Column(String(100), nullable=False, index=True)  # 生成批次ID
    mode = Column(String(50), nullable=False)
    count = Column(Integer, nullable=False)  # 生成数量
    success_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    prompt_used = Column(Text, nullable=False)
    chatgpt_response = Column(Text)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# 创建所有表
def create_tables():
    Base.metadata.create_all(bind=engine)

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 数据库初始化
def init_database():
    create_tables()
    print("数据库表创建完成")
