from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GTO Learner API", version="0.1.0")

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "GTO Learner API is running"}

@app.get("/api/v1/questions")
async def get_question(mode: str = "综合练习", count: int = 1):
    # 返回测试题目 UTG UTG1 CO BTN SB BB
    return {
        "id": 1,
        "mode": mode,
        "stage": "preflop", # preflop, flop, turn, river
        "position": "BTN",
        "stacks": [100, 100, 100, 100, 100, 100],
        "pot": 4.5,
        "action_history": [preflop:["UTG raise 3", "UTG1 fold", "CO fold"], flop: [], turn: [], river: []],
        "board": [],
        "hole_cards": ["As", "Kh"],
        "ref_solution": {"call": 40, "raise": 60}
    }

@app.post("/api/v1/judge")
async def judge_answer(question_id: int, user_action: str):
    # 简单的判分逻辑
    ref_solution = {"call": 40, "raise": 60}
    frequency = ref_solution.get(user_action, 0)
    
    is_correct = frequency >= 30
    
    return {
        "is_correct": is_correct,
        "user_action": user_action,
        "ref_distribution": ref_solution,
        "explanation": "这是一个测试解析"
    }

@app.post("/api/v1/explain")
async def get_explanation(question_id: int, user_action: str):
    return {
        "explanation": f"对于题目{question_id}，你的动作{user_action}的解析是..."
    }
