"""
题目管理服务
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from .database import Question, QuestionGenerationLog
from .chatgpt_generator import ChatGPTQuestionGenerator
from typing import List, Dict, Any, Optional
import json
import random
from datetime import datetime

class QuestionManager:
    def __init__(self, db: Session):
        self.db = db
        self.generator = None  # 延迟初始化
    
    def generate_and_save_questions(self, mode: str, count: int = 20, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        生成并保存题目到数据库
        
        Args:
            mode: 题目类型
            count: 生成数量
            custom_prompt: 自定义提示词
            
        Returns:
            操作结果
        """
        # 延迟初始化ChatGPT生成器
        if self.generator is None:
            self.generator = ChatGPTGenerator()
        
        # 生成题目
        result = self.generator.generate_questions(mode, count, custom_prompt)
        
        # 记录生成日志
        log = QuestionGenerationLog(
            generation_id=result["generation_id"],
            mode=mode,
            count=count,
            success_count=0,
            failed_count=0,
            prompt_used=result["prompt_used"],
            chatgpt_response=result["chatgpt_response"],
            error_message=result["error"]
        )
        
        if not result["success"]:
            log.failed_count = count
            self.db.add(log)
            self.db.commit()
            return result
        
        # 保存题目到数据库
        success_count = 0
        failed_count = 0
        
        for question_data in result["questions"]:
            try:
                # 验证题目格式
                if not self.generator.validate_question(question_data):
                    failed_count += 1
                    continue
                
                # 创建题目对象
                question = Question(
                    mode=question_data["mode"],
                    stage=question_data["stage"],
                    position=question_data["position"],
                    stacks=question_data["stacks"],
                    action_history=question_data["action_history"],
                    hole_cards=question_data["hole_cards"],
                    board=question_data["board"],
                    ref_solution=question_data["ref_solution"],
                    explanation=question_data["explanation"],
                    pot=question_data.get("pot", 0),  # 默认值为0
                    hero_cards=question_data.get("hero_cards"),  # 可选字段
                    source="chatgpt",
                    version="1.0"
                )
                
                self.db.add(question)
                success_count += 1
                
            except Exception as e:
                print(f"保存题目失败: {str(e)}")
                failed_count += 1
        
        # 更新日志
        log.success_count = success_count
        log.failed_count = failed_count
        
        self.db.add(log)
        self.db.commit()
        
        return {
            "success": True,
            "generation_id": result["generation_id"],
            "total_generated": len(result["questions"]),
            "success_count": success_count,
            "failed_count": failed_count,
            "mode": mode
        }
    
    def get_questions_by_mode(self, mode: str, limit: int = 100) -> List[Question]:
        """
        根据模式获取题目
        
        Args:
            mode: 题目类型
            limit: 限制数量
            
        Returns:
            题目列表
        """
        return self.db.query(Question).filter(
            Question.mode == mode,
            Question.is_active == True
        ).limit(limit).all()
    
    def get_random_question(self, mode: str) -> Optional[Question]:
        """
        随机获取一道题目
        
        Args:
            mode: 题目类型
            
        Returns:
            题目对象或None
        """
        questions = self.db.query(Question).filter(
            Question.mode == mode,
            Question.is_active == True
        ).all()
        return random.choice(questions) if questions else None
    
    def get_question_by_id(self, question_id: int) -> Optional[Question]:
        """
        根据ID获取题目
        
        Args:
            question_id: 题目ID
            
        Returns:
            题目对象或None
        """
        return self.db.query(Question).filter(
            Question.id == question_id,
            Question.is_active == True
        ).first()
    
    def update_question(self, question_id: int, update_data: Dict[str, Any]) -> bool:
        """
        更新题目
        
        Args:
            question_id: 题目ID
            update_data: 更新数据
            
        Returns:
            是否成功
        """
        try:
            question = self.get_question_by_id(question_id)
            if not question:
                return False
            
            for key, value in update_data.items():
                if hasattr(question, key):
                    setattr(question, key, value)
            
            question.updated_at = datetime.utcnow()
            self.db.commit()
            return True
            
        except Exception as e:
            print(f"更新题目失败: {str(e)}")
            self.db.rollback()
            return False
    
    def delete_question(self, question_id: int) -> bool:
        """
        软删除题目
        
        Args:
            question_id: 题目ID
            
        Returns:
            是否成功
        """
        try:
            question = self.get_question_by_id(question_id)
            if not question:
                return False
            
            question.is_active = False
            question.updated_at = datetime.utcnow()
            self.db.commit()
            return True
            
        except Exception as e:
            print(f"删除题目失败: {str(e)}")
            self.db.rollback()
            return False
    
    def get_question_stats(self) -> Dict[str, Any]:
        """
        获取题目统计信息
        
        Returns:
            统计信息
        """
        total_questions = self.db.query(Question).filter(Question.is_active == True).count()
        
        stats = {
            "total_questions": total_questions,
            "by_mode": {},
            "by_stage": {},
            "by_source": {}
        }
        
        # 按模式统计
        modes = ["synthesis", "value", "bluff"]
        for mode in modes:
            count = self.db.query(Question).filter(
                Question.mode == mode,
                Question.is_active == True
            ).count()
            stats["by_mode"][mode] = count
        
        # 按阶段统计
        stages = ["preflop", "flop", "turn", "river"]
        for stage in stages:
            count = self.db.query(Question).filter(
                Question.stage == stage,
                Question.is_active == True
            ).count()
            stats["by_stage"][stage] = count
        
        # 按来源统计
        sources = self.db.query(Question.source).filter(Question.is_active == True).distinct().all()
        for source in sources:
            count = self.db.query(Question).filter(
                Question.source == source[0],
                Question.is_active == True
            ).count()
            stats["by_source"][source[0]] = count
        
        return stats
    
    def _calculate_pot_size(self, action_history: dict, stacks: list) -> int:
        """
        根据行动历史计算实际的底池大小
        
        Args:
            action_history: 行动历史字典
            stacks: 玩家筹码数组
            
        Returns:
            计算出的底池大小
        """
        pot = 0
             
        # 遍历所有阶段的行动
        for stage in ['preflop', 'flop', 'turn', 'river']:
            actions = action_history.get(stage, [])
            call_number = 0 
            current_bet = 0 
 
            for action_str in reversed(actions):
                parts = action_str.split(' ')
                if len(parts) >= 2:
                    action = parts[1]
                    position = parts[0]
                    
                    if action == 'raise' and len(parts) >= 3:
                        try:
                            amount = int(parts[2])
                            # raise会增加底池
                            current_bet = amount
                            pot += current_bet
                            break
                
                        except ValueError:
                            pass
                    elif action == 'call':
                        # call会匹配当前的下注金额
                        call_number += 1
                    elif action == 'fold' or 'check':
                        if position == 'SB' and stage == 'preflop':
                            pot += 1
                        if position == 'BB' and stage == 'preflop':
                            pot += 2                      
            
            pot += current_bet * call_number
        
        return pot

    def _validate_question_format(self, question_data: Dict[str, Any]) -> bool:
        """
        验证题目格式是否正确
        
        Args:
            question_data: 题目数据
            
        Returns:
            是否格式正确
        """
        required_fields = [
            "mode", "stage", "position", "stacks", 
            "action_history", "hole_cards", "board", 
            "ref_solution", "explanation"
        ]
        
        # 检查必填字段
        for field in required_fields:
            if field not in question_data:
                return False
        
        # 检查字段类型
        if not isinstance(question_data["mode"], str):
            return False
        if not isinstance(question_data["stage"], str):
            return False
        if not isinstance(question_data["position"], str):
            return False
        if not isinstance(question_data["stacks"], list) or len(question_data["stacks"]) != 6:
            return False
        if not isinstance(question_data["action_history"], dict):
            return False
        if not isinstance(question_data["hole_cards"], list) or len(question_data["hole_cards"]) != 2:
            return False
        if not isinstance(question_data["board"], list):
            return False
        if not isinstance(question_data["ref_solution"], dict):
            return False
        if not isinstance(question_data["explanation"], str):
            return False
        
        # 检查ref_solution中的频率值
        for action, freq in question_data["ref_solution"].items():
            if not isinstance(freq, int) or freq not in [1, 2, 3]:
                return False
        
        return True
    
    def upload_questions_from_json(self, json_file_path: str) -> Dict[str, Any]:
        """
        从JSON文件上传题目到数据库
        
        Args:
            json_file_path: JSON文件路径
            
        Returns:
            上传结果
        """
        try:
            # 读取JSON文件
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 支持两种格式：直接数组或包含questions字段的对象
            if isinstance(data, list):
                questions_data = data
            elif isinstance(data, dict) and 'questions' in data:
                questions_data = data['questions']
            else:
                return {
                    "success": False,
                    "error": "JSON格式错误：必须是题目数组或包含'questions'字段的对象"
                }
            
            success_count = 0
            failed_count = 0
            failed_questions = []
            
            for i, question_data in enumerate(questions_data):
                try:
                    # 验证题目格式
                    if not self._validate_question_format(question_data):
                        failed_count += 1
                        failed_questions.append({
                            "index": i,
                            "error": "题目格式验证失败",
                            "data": question_data
                        })
                        continue
                    
                    # 暂时跳过重复检查，直接添加题目
                    # TODO: 修复JSON字段比较问题
                    
                    # 计算实际的pot大小
                    calculated_pot = self._calculate_pot_size(
                        question_data["action_history"], 
                        question_data["stacks"]
                    )
                    json_pot = question_data.get("pot", 0)
                    
                    # 如果JSON中的pot与计算的不一致，使用计算的值
                    if json_pot != calculated_pot:
                        print(f"Pot值修正: JSON={json_pot} -> 计算={calculated_pot}")
                    
                    # 创建新题目
                    question = Question(
                        mode=question_data["mode"],
                        stage=question_data["stage"],
                        position=question_data["position"],
                        stacks=question_data["stacks"],
                        action_history=question_data["action_history"],
                        hole_cards=question_data["hole_cards"],
                        board=question_data["board"],
                        ref_solution=question_data["ref_solution"],
                        explanation=question_data["explanation"],
                        pot=calculated_pot,  # 使用计算出的pot值
                        hero_cards=question_data.get("hero_cards"),  # 可选字段
                        source="json_upload",
                        version="1.0"
                    )
                    
                    self.db.add(question)
                    success_count += 1
                    print(f"添加新题目: {question_data.get('mode', 'Unknown')} - {question_data.get('position', 'Unknown')}")
                
                except Exception as e:
                    failed_count += 1
                    failed_questions.append({
                        "index": i,
                        "error": str(e),
                        "data": question_data
                    })
                    print(f"处理题目 {i} 失败: {str(e)}")
            
            # 提交数据库更改
            self.db.commit()
            
            return {
                "success": True,
                "total_processed": len(questions_data),
                "success_count": success_count,
                "failed_count": failed_count,
                "failed_questions": failed_questions,
                "file_path": json_file_path
            }
            
        except FileNotFoundError:
            return {
                "success": False,
                "error": f"文件未找到: {json_file_path}"
            }
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"JSON解析错误: {str(e)}"
            }
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "error": f"上传失败: {str(e)}"
            }
    
    def export_questions_to_json(self, mode: Optional[str] = None, output_file: str = "questions_export.json") -> Dict[str, Any]:
        """
        导出题目到JSON文件
        
        Args:
            mode: 指定模式，None表示导出所有
            output_file: 输出文件名
            
        Returns:
            导出结果
        """
        try:
            # 查询题目
            query = self.db.query(Question).filter(Question.is_active == True)
            if mode:
                query = query.filter(Question.mode == mode)
            
            questions = query.all()
            
            # 转换为字典格式
            questions_data = []
            for q in questions:
                question_dict = {
                    "id": q.id,
                    "mode": q.mode,
                    "stage": q.stage,
                    "position": q.position,
                    "stacks": q.stacks,
                    "action_history": q.action_history,
                    "hole_cards": q.hole_cards,
                    "board": q.board,
                    "ref_solution": q.ref_solution,
                    "explanation": q.explanation,
                    "pot": q.pot,
                    "hero_cards": q.hero_cards,
                    "created_at": q.created_at.isoformat() if q.created_at else None,
                    "source": q.source,
                    "version": q.version,
                    "difficulty": q.difficulty
                }
                questions_data.append(question_dict)
            
            # 写入JSON文件
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "export_info": {
                        "export_time": datetime.utcnow().isoformat(),
                        "total_count": len(questions_data),
                        "mode_filter": mode,
                        "version": "1.0"
                    },
                    "questions": questions_data
                }, f, ensure_ascii=False, indent=2)
            
            return {
                "success": True,
                "exported_count": len(questions_data),
                "output_file": output_file,
                "mode_filter": mode
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"导出失败: {str(e)}"
            }
    
    def delete_questions(self, mode: Optional[str] = None, confirm: bool = False) -> Dict[str, Any]:
        """
        删除题目
        
        Args:
            mode: 指定模式，None表示删除所有题目
            confirm: 确认删除标志，必须为True才能执行删除
            
        Returns:
            删除结果
        """
        if not confirm:
            return {
                "success": False,
                "error": "删除操作需要确认，请设置 confirm=True"
            }
        
        try:
            # 构建查询
            query = self.db.query(Question).filter(Question.is_active == True)
            if mode:
                query = query.filter(Question.mode == mode)
            
            # 获取要删除的题目
            questions_to_delete = query.all()
            count = len(questions_to_delete)
            
            if count == 0:
                mode_text = f" {mode} 模式" if mode else ""
                return {
                    "success": True,
                    "deleted_count": 0,
                    "message": f"没有找到{mode_text}的题目"
                }
            
            # 执行软删除（设置is_active=False）
            for question in questions_to_delete:
                question.is_active = False
                question.updated_at = datetime.utcnow()
            
            # 提交更改
            self.db.commit()
            
            mode_text = f" {mode} 模式" if mode else "所有"
            return {
                "success": True,
                "deleted_count": count,
                "mode_filter": mode,
                "message": f"成功删除{mode_text}的 {count} 道题目"
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "error": f"删除失败: {str(e)}"
            }
    
    def hard_delete_questions(self, mode: Optional[str] = None, confirm: bool = False) -> Dict[str, Any]:
        """
        硬删除题目（从数据库中完全删除）
        
        Args:
            mode: 指定模式，None表示删除所有题目
            confirm: 确认删除标志，必须为True才能执行删除
            
        Returns:
            删除结果
        """
        if not confirm:
            return {
                "success": False,
                "error": "硬删除操作需要确认，请设置 confirm=True"
            }
        
        try:
            # 构建查询
            query = self.db.query(Question)
            if mode:
                query = query.filter(Question.mode == mode)
            
            # 获取要删除的题目
            questions_to_delete = query.all()
            count = len(questions_to_delete)
            
            if count == 0:
                mode_text = f" {mode} 模式" if mode else ""
                return {
                    "success": True,
                    "deleted_count": 0,
                    "message": f"没有找到{mode_text}的题目"
                }
            
            # 执行硬删除
            for question in questions_to_delete:
                self.db.delete(question)
            
            # 提交更改
            self.db.commit()
            
            mode_text = f" {mode} 模式" if mode else "所有"
            return {
                "success": True,
                "deleted_count": count,
                "mode_filter": mode,
                "message": f"成功硬删除{mode_text}的 {count} 道题目"
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "error": f"硬删除失败: {str(e)}"
            }
    
    def restore_questions(self, mode: Optional[str] = None) -> Dict[str, Any]:
        """
        恢复被软删除的题目
        
        Args:
            mode: 指定模式，None表示恢复所有被删除的题目
            
        Returns:
            恢复结果
        """
        try:
            # 构建查询
            query = self.db.query(Question).filter(Question.is_active == False)
            if mode:
                query = query.filter(Question.mode == mode)
            
            # 获取要恢复的题目
            questions_to_restore = query.all()
            count = len(questions_to_restore)
            
            if count == 0:
                mode_text = f" {mode} 模式" if mode else ""
                return {
                    "success": True,
                    "restored_count": 0,
                    "message": f"没有找到{mode_text}被删除的题目"
                }
            
            # 恢复题目
            for question in questions_to_restore:
                question.is_active = True
                question.updated_at = datetime.utcnow()
            
            # 提交更改
            self.db.commit()
            
            mode_text = f" {mode} 模式" if mode else "所有"
            return {
                "success": True,
                "restored_count": count,
                "mode_filter": mode,
                "message": f"成功恢复{mode_text}的 {count} 道题目"
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                "success": False,
                "error": f"恢复失败: {str(e)}"
            }
