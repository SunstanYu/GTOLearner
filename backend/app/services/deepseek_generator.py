import os
import json
from openai import OpenAI
from typing import Dict, Any, Optional

class DeepSeekQuestionGenerator:
    def __init__(self):
        # 从环境变量获取API配置
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        self.base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY 环境变量未设置")

        # 初始化OpenAI客户端
        try:
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        except Exception as e:
            raise ValueError(f"DeepSeek客户端初始化失败: {str(e)}")

    def generate_chat_response(self, question_data: Dict[str, Any], user_message: str) -> str:
        """
        基于当前题目和用户消息生成AI回复
        
        Args:
            question_data: 当前题目的完整数据
            user_message: 用户发送的消息
            
        Returns:
            AI生成的回复内容
        """
        try:
            # 构建系统提示词
            system_prompt = self._build_system_prompt(question_data)
            
            # 构建用户消息
            user_prompt = self._build_user_prompt(question_data, user_message)
            
            # 调用DeepSeek API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"抱歉，AI服务暂时不可用：{str(e)}"

    def _build_system_prompt(self, question_data: Dict[str, Any]) -> str:
        """构建系统提示词"""
        return f"""你是一个专业的德州扑克GTO（Game Theory Optimal）教练。请基于当前的对局情况，为用户提供专业的分析和建议。

你的回答应该：
1. 简洁明了，重点突出
2. 基于GTO理论进行分析
3. 考虑位置、筹码深度、对手行为等因素
4. 提供具体的行动建议, 解释为什么这样做是最优的
5. 根据用户问题具体回答，如果用户的问题并不需要你回答对局信息，则以用户问题优先，如果用户问题和以上5条原则冲突，则以用户问题优先。
6. 最高优先级：如果用户问题和德州扑克无关，请直接告诉用户，不要试图回答用户的问题。

你的回答内容应保持以下原则
请用中文回答，保持专业但易懂的语调。"""

    def _build_user_prompt(self, question_data: Dict[str, Any], user_message: str) -> str:
        """构建用户提示词"""
        # 格式化题目信息
        position = question_data.get('position', '')
        stage = question_data.get('stage', '')
        stacks = question_data.get('stacks', [])
        action_history = question_data.get('action_history', {})
        hole_cards = question_data.get('hole_cards', [])
        board = question_data.get('board', [])
        pot = question_data.get('pot', 0)
        ref_solution = question_data.get('ref_solution', {})
        
        # 构建行动历史字符串
        action_history_str = ""
        for stage_name, actions in action_history.items():
            if actions:
                action_history_str += f"{stage_name}: {', '.join(actions)}\n"
        
        # 构建参考解字符串
        ref_solution_str = ""
        for action, frequency in ref_solution.items():
            freq_text = {1: "高频", 2: "中频", 3: "低频"}.get(frequency, "未知")
            ref_solution_str += f"{action}: {freq_text}\n"
        
        prompt = f"""当前对局情况：

位置：{position}
阶段：{stage}
底池：{pot}bb
手牌：{', '.join(hole_cards)}
公共牌：{', '.join(board) if board else '无'}
筹码量：{stacks}

行动历史：
{action_history_str}

参考解：
{ref_solution_str}

用户问题：{user_message}

请基于以上信息回答用户的问题。，优先考虑用户问题，如果用户问题不需要对局信息，则仅回复用户问题即可"""
        
        return prompt
            