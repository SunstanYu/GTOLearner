from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
from typing import Dict, List, Optional

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

class JudgeRequest(BaseModel):
    question_id: int
    user_action: str

class JudgeResponse(BaseModel):
    is_correct: bool
    user_action: str
    ref_solution: Dict[str, int]
    explanation: str

# 加载题目数据
def load_questions():
    try:
        with open("seed/questions.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            return data["questions"]
    except FileNotFoundError:
        return []

# 全局变量存储题目
questions_data = load_questions()

@app.get("/")
async def root():
    return {"message": "GTO Learner API is running"}

@app.get("/api/v1/questions")
async def get_question(mode: str = "综合练习"):
    """获取指定模式的随机题目"""
    if not questions_data:
        raise HTTPException(status_code=404, detail="No questions available")
    
    # 筛选指定模式的题目
    mode_questions = [q for q in questions_data if q["mode"] == mode]
    
    if not mode_questions:
        raise HTTPException(status_code=404, detail=f"No questions found for mode: {mode}")
    
    # 随机选择一道题
    question = random.choice(mode_questions)
    return question

@app.get("/api/v1/questions/{question_id}")
async def get_question_by_id(question_id: int):
    """根据ID获取特定题目"""
    question = next((q for q in questions_data if q["id"] == question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@app.post("/api/v1/judge", response_model=JudgeResponse)
async def judge_answer(request: JudgeRequest):
    """判断用户答案是否正确"""
    # 查找题目
    question = next((q for q in questions_data if q["id"] == request.question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    ref_solution = question["ref_solution"]
    user_action = request.user_action
    
    # 判断逻辑
    is_correct = ref_solution.get(user_action, 0) > 0
    
    # 生成解释
    if is_correct:
        percentage = ref_solution[user_action]
        explanation = f"正确！根据GTO策略，{user_action}在这个位置有{percentage}%的频率。"
    else:
        # 找到最佳行动
        best_action = max(ref_solution.items(), key=lambda x: x[1])
        explanation = f"不正确。根据GTO策略，最佳行动是{best_action[0]}（{best_action[1]}%频率）。"
    
    return JudgeResponse(
        is_correct=is_correct,
        user_action=user_action,
        ref_solution=ref_solution,
        explanation=explanation
    )

@app.get("/api/v1/questions/next/{current_id}")
async def get_next_question(current_id: int, mode: str = "综合练习"):
    """获取下一题（同模式下）"""
    if not questions_data:
        raise HTTPException(status_code=404, detail="No questions available")
    
    # 筛选指定模式的题目
    mode_questions = [q for q in questions_data if q["mode"] == mode]
    
    if not mode_questions:
        raise HTTPException(status_code=404, detail=f"No questions found for mode: {mode}")
    
    # 找到当前题目的索引
    current_index = next((i for i, q in enumerate(mode_questions) if q["id"] == current_id), -1)
    
    if current_index == -1:
        # 如果找不到当前题目，返回随机题目
        return random.choice(mode_questions)
    
    # 获取下一题（循环）
    next_index = (current_index + 1) % len(mode_questions)
    return mode_questions[next_index]

@app.get("/api/v1/modes")
async def get_modes():
    """获取所有可用的练习模式"""
    if not questions_data:
        return []
    
    modes = list(set(q["mode"] for q in questions_data))
    return modes