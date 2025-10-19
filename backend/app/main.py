from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from .database import get_db, Question, init_database
from .question_manager import QuestionManager

app = FastAPI(title="GTO Learner API", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class QuestionData(BaseModel):
    id: int
    mode: str
    position: str
    stage: str
    stacks: List[int]
    action_history: Dict[str, List[str]]
    hole_cards: List[str]
    board: List[str]
    ref_solution: Dict[str, int]
    pot: int

class JudgeRequest(BaseModel):
    question_id: int
    user_action: str

class JudgeResponse(BaseModel):
    isCorrect: int  # 0=不对, 1=半对, 2=全对
    userAction: str
    refSolution: Dict[str, int]
    explanation: str

# 初始化数据库
init_database()

@app.get("/")
async def root():
    return {"message": "GTO Learner API is running"}

@app.get("/api/v1/questions")
async def get_question(mode: str = "synthesis", db: Session = Depends(get_db)):
    """获取指定模式的随机题目"""
    print(f"=== 获取题目开始 ===")
    print(f"请求模式: {mode}")
    print(f"请求模式bytes: {mode.encode('utf-8')}")
    print(f"请求模式repr: {repr(mode)}")
    
    manager = QuestionManager(db)
    question = manager.get_random_question(mode)
    
    if not question:
        print(f"没有找到 {mode} 模式的题目")
        raise HTTPException(status_code=404, detail=f"没有找到 {mode} 模式的题目")
    
    # 转换为字典格式
    question_dict = {
        "id": question.id,
        "mode": question.mode,
        "stage": question.stage,
        "position": question.position,
        "stacks": question.stacks,
        "action_history": question.action_history,
        "hole_cards": question.hole_cards,
        "board": question.board,
        "ref_solution": question.ref_solution,
        "explanation": question.explanation,
        "pot": question.pot
    }
    
    print(f"选择的题目ID: {question.id}")
    print(f"=== 获取题目结束 ===")
    
    return question_dict

@app.get("/api/v1/questions/{question_id}")
async def get_question_by_id(question_id: int, db: Session = Depends(get_db)):
    """根据ID获取特定题目"""
    manager = QuestionManager(db)
    question = manager.get_question_by_id(question_id)
    
    if not question:
        raise HTTPException(status_code=404, detail="题目未找到")
    
    return {
        "id": question.id,
        "mode": question.mode,
        "stage": question.stage,
        "position": question.position,
        "stacks": question.stacks,
        "action_history": question.action_history,
        "hole_cards": question.hole_cards,
        "board": question.board,
        "ref_solution": question.ref_solution,
        "explanation": question.explanation
    }

@app.post("/api/v1/judge", response_model=JudgeResponse)
async def judge_answer(request: JudgeRequest, db: Session = Depends(get_db)):
    """判断用户答案是否正确"""
    print(f"=== 后端收到判断请求 ===")
    print(f"请求数据: question_id={request.question_id}, user_action={request.user_action}")
    
    # 查找题目
    manager = QuestionManager(db)
    question = manager.get_question_by_id(request.question_id)
    
    if not question:
        print(f"❌ 未找到题目 ID: {request.question_id}")
        raise HTTPException(status_code=404, detail="题目未找到")
    
    print(f"✅ 找到题目: {question.id}")
    print(f"题目ref_solution: {question.ref_solution}")
    
    ref_solution = question.ref_solution
    user_action = request.user_action
    
    print(f"用户行动: {user_action}")
    print(f"在ref_solution中查找: {user_action}")
    
    # 判断逻辑：0=不对, 1=半对, 2=全对
    frequency_level = ref_solution.get(user_action, 0)
    print(f"找到的频率等级: {frequency_level}")
    
    if frequency_level == 1:
        is_correct = 2  # 全对（高频）
        print("判断结果: 全对 (2)")
    elif frequency_level == 2:
        is_correct = 1  # 半对（中频）
        print("判断结果: 半对 (1)")
    elif frequency_level == 3:
        is_correct = 0  # 不对（低频）
        print("判断结果: 不对 (0)")
    else:
        is_correct = 0  # 不对（不在参考解中）
        print("判断结果: 不对 (0) - 不在参考解中")
    
    # 使用题库中的解释
    explanation = question.explanation
    print(f"解释内容: {explanation}")
    
    result = JudgeResponse(
        isCorrect=is_correct,
        userAction=user_action,
        refSolution=ref_solution,
        explanation=explanation
    )
    
    print(f"返回结果: {result}")
    print(f"=== 后端判断完成 ===")
    
    return result

# 新增API端点
@app.post("/api/v1/admin/generate-questions")
async def generate_questions(
    mode: str,
    count: int = 20,
    custom_prompt: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """管理员API：生成新题目"""
    manager = QuestionManager(db)
    result = manager.generate_and_save_questions(mode, count, custom_prompt)
    return result

@app.get("/api/v1/admin/stats")
async def get_stats(db: Session = Depends(get_db)):
    """管理员API：获取题目统计"""
    manager = QuestionManager(db)
    stats = manager.get_question_stats()
    return stats

@app.get("/api/v1/admin/questions")
async def get_all_questions(
    mode: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """管理员API：获取所有题目"""
    manager = QuestionManager(db)
    if mode:
        questions = manager.get_questions_by_mode(mode, limit)
    else:
        questions = db.query(Question).filter(Question.is_active == True).limit(limit).all()
    
    return [
        {
            "id": q.id,
            "mode": q.mode,
            "stage": q.stage,
            "position": q.position,
            "created_at": q.created_at,
            "source": q.source,
            "is_active": q.is_active
        }
        for q in questions
    ]

@app.get("/api/v1/questions/next/{current_id}")
async def get_next_question(current_id: int, mode: str = "synthesis", db: Session = Depends(get_db)):
    """获取下一题（同模式下）"""
    print(f"=== 获取下一题开始 ===")
    print(f"当前题目ID: {current_id}")
    print(f"模式: {mode}")
    
    manager = QuestionManager(db)
    
    # 获取指定模式的所有题目
    mode_questions = manager.get_questions_by_mode(mode)
    
    if not mode_questions:
        print(f"没有找到 {mode} 模式的题目")
        raise HTTPException(status_code=404, detail=f"No questions found for mode: {mode}")
    
    print(f"找到 {len(mode_questions)} 道 {mode} 模式的题目")
    
    # 找到当前题目的索引
    current_index = next((i for i, q in enumerate(mode_questions) if q.id == current_id), -1)
    
    if current_index == -1:
        print("找不到当前题目，返回随机题目")
        # 如果找不到当前题目，返回随机题目
        question = random.choice(mode_questions)
    else:
        # 获取下一题（循环）
        next_index = (current_index + 1) % len(mode_questions)
        question = mode_questions[next_index]
        print(f"下一题索引: {next_index}, 题目ID: {question.id}")
    
    # 转换为字典格式
    question_dict = {
        "id": question.id,
        "mode": question.mode,
        "stage": question.stage,
        "position": question.position,
        "stacks": question.stacks,
        "action_history": question.action_history,
        "hole_cards": question.hole_cards,
        "board": question.board,
        "ref_solution": question.ref_solution,
        "explanation": question.explanation,
        "pot": question.pot
    }
    
    print(f"=== 获取下一题结束 ===")
    return question_dict

@app.get("/api/v1/modes")
async def get_modes():
    """获取所有可用的练习模式"""
    if not questions_data:
        return []
    
    modes = list(set(q["mode"] for q in questions_data))
    return modes