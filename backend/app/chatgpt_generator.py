"""
ChatGPT API通信模块
"""
import openai
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class ChatGPTQuestionGenerator:
    def __init__(self):
        # 从环境变量获取API配置
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY 环境变量未设置")
        
        # 初始化OpenAI客户端
        try:
            # 设置API密钥和基础URL
            openai.api_key = self.api_key
            openai.api_base = self.base_url
            
            # 创建客户端
            self.client = openai.OpenAI()
        except Exception as e:
            print(f"OpenAI客户端初始化失败: {str(e)}")
            raise
    
    def generate_questions(self, mode: str, count: int = 20, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        生成指定数量的题目
        
        Args:
            mode: 题目类型 (综合练习, 价值练习, bluff练习)
            count: 生成数量
            custom_prompt: 自定义提示词
            
        Returns:
            包含生成结果的字典
        """
        generation_id = str(uuid.uuid4())
        
        # 默认提示词模板
        default_prompts = {
            "综合练习": """
请生成{count}道德州扑克GTO综合练习题，要求：

1. 题目格式必须是JSON数组，每个题目包含以下字段：
   - mode: "综合练习"
   - stage: 游戏阶段 (preflop/flop/turn/river)
   - position: 玩家位置 (UTG/UTG1/CO/BTN/SB/BB)
   - stacks: 筹码数组 [100, 95, 110, 100, 50, 25]
   - action_history: 行动历史 {"preflop": [...], "flop": [...], "turn": [...], "river": [...]}
   - hole_cards: 手牌 ["As", "Kh"]
   - board: 公共牌 ["5c", "7h", "2d"]
   - ref_solution: 参考解 {"call": 1, "raise13": 2, "raise12": 2, "raise23": 3, "raise11": 3, "fold": 3}
   - explanation: 详细解释

2. 难度分布：40%简单，40%中等，20%困难
3. 涵盖不同位置和游戏阶段
4. ref_solution中数字含义：1=高频(>30%), 2=中频(10-30%), 3=低频(<10%)
5. 解释要详细说明GTO原理和决策依据

请直接返回JSON数组，不要包含其他文字。
""",
            "价值练习": """
请生成{count}道德州扑克GTO价值练习题目，重点训练价值下注和跟注决策：

1. 题目格式必须是JSON数组，每个题目包含以下字段：
   - mode: "价值练习"
   - stage: 游戏阶段 (preflop/flop/turn/river)
   - position: 玩家位置 (UTG/UTG1/CO/BTN/SB/BB)
   - stacks: 筹码数组 [100, 95, 110, 100, 50, 25]
   - action_history: 行动历史 {"preflop": [...], "flop": [...], "turn": [...], "river": [...]}
   - hole_cards: 手牌 ["As", "Kh"]
   - board: 公共牌 ["5c", "7h", "2d"]
   - ref_solution: 参考解 {"call": 1, "raise13": 2, "raise12": 2, "raise23": 3, "raise11": 3, "fold": 3}
   - explanation: 详细解释

2. 重点场景：
   - 强牌的价值下注
   - 中等牌力的跟注决策
   - 位置优势的利用
   - 筹码深度的影响

3. ref_solution中数字含义：1=高频(>30%), 2=中频(10-30%), 3=低频(<10%)
4. 解释要重点说明价值下注的原理和时机

请直接返回JSON数组，不要包含其他文字。
""",
            "bluff练习": """
请生成{count}道德州扑克GTO诈唬练习题目，重点训练诈唬和弃牌决策：

1. 题目格式必须是JSON数组，每个题目包含以下字段：
   - mode: "bluff练习"
   - stage: 游戏阶段 (preflop/flop/turn/river)
   - position: 玩家位置 (UTG/UTG1/CO/BTN/SB/BB)
   - stacks: 筹码数组 [100, 95, 110, 100, 50, 25]
   - action_history: 行动历史 {"preflop": [...], "flop": [...], "turn": [...], "river": [...]}
   - hole_cards: 手牌 ["As", "Kh"]
   - board: 公共牌 ["5c", "7h", "2d"]
   - ref_solution: 参考解 {"call": 1, "raise13": 2, "raise12": 2, "raise23": 3, "raise11": 3, "fold": 3}
   - explanation: 详细解释

2. 重点场景：
   - 诈唬的时机和频率
   - 弃牌的正确时机
   - 半诈唬的运用
   - 对手范围的阅读

3. ref_solution中数字含义：1=高频(>30%), 2=中频(10-30%), 3=低频(<10%)
4. 解释要重点说明诈唬的原理和弃牌的重要性

请直接返回JSON数组，不要包含其他文字。
"""
        }
        
        # 使用自定义提示词或默认提示词
        prompt_template = custom_prompt or default_prompts.get(mode, default_prompts["综合练习"])
        prompt = prompt_template.format(count=count)
        
        try:
            # 调用ChatGPT API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的德州扑克GTO策略专家，擅长生成高质量的练习题。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4000
            )
            
            # 解析响应
            content = response.choices[0].message.content.strip()
            
            # 尝试解析JSON
            try:
                questions = json.loads(content)
                if not isinstance(questions, list):
                    raise ValueError("响应不是数组格式")
                
                return {
                    "success": True,
                    "generation_id": generation_id,
                    "questions": questions,
                    "count": len(questions),
                    "prompt_used": prompt,
                    "chatgpt_response": content,
                    "error": None
                }
                
            except json.JSONDecodeError as e:
                return {
                    "success": False,
                    "generation_id": generation_id,
                    "questions": [],
                    "count": 0,
                    "prompt_used": prompt,
                    "chatgpt_response": content,
                    "error": f"JSON解析错误: {str(e)}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "generation_id": generation_id,
                "questions": [],
                "count": 0,
                "prompt_used": prompt,
                "chatgpt_response": None,
                "error": f"API调用错误: {str(e)}"
            }
    
    def validate_question(self, question: Dict[str, Any]) -> bool:
        """
        验证题目格式是否正确
        
        Args:
            question: 题目字典
            
        Returns:
            是否有效
        """
        required_fields = [
            "mode", "stage", "position", "stacks", 
            "action_history", "hole_cards", "board", 
            "ref_solution", "explanation"
        ]
        
        # 检查必需字段
        for field in required_fields:
            if field not in question:
                return False
        
        # 检查字段类型
        if not isinstance(question["stacks"], list) or len(question["stacks"]) != 6:
            return False
        
        if not isinstance(question["action_history"], dict):
            return False
        
        if not isinstance(question["hole_cards"], list) or len(question["hole_cards"]) != 2:
            return False
        
        if not isinstance(question["ref_solution"], dict):
            return False
        
        return True
