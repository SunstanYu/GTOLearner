#!/usr/bin/env python3
"""
题目更新命令行工具
"""
import argparse
import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_database
from app.question_manager import QuestionManager
from app.chatgpt_generator import ChatGPTQuestionGenerator

def main():
    parser = argparse.ArgumentParser(description="德州扑克GTO题目管理工具")
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    # 生成题目命令
    generate_parser = subparsers.add_parser("generate", help="生成新题目")
    generate_parser.add_argument("--mode", required=True, choices=["synthesis", "value", "bluff"], 
                                 help="题目类型")
    generate_parser.add_argument("--count", type=int, default=20, help="生成数量 (默认: 20)")
    generate_parser.add_argument("--prompt", help="自定义提示词文件路径")
    
    # 查看统计命令
    stats_parser = subparsers.add_parser("stats", help="查看题目统计")
    
    # 初始化数据库命令
    init_parser = subparsers.add_parser("init", help="初始化数据库")
    
    # 测试ChatGPT连接命令
    test_parser = subparsers.add_parser("test", help="测试ChatGPT连接")
    
    # 上传JSON题目命令
    upload_parser = subparsers.add_parser("upload", help="从JSON文件上传题目")
    upload_parser.add_argument("--file", required=True, help="JSON文件路径")
    
    # 导出题目命令
    export_parser = subparsers.add_parser("export", help="导出题目到JSON文件")
    export_parser.add_argument("--mode", help="指定模式，不指定则导出所有")
    export_parser.add_argument("--output", default="questions_export.json", help="输出文件名")
    
    # 删除题目命令
    delete_parser = subparsers.add_parser("delete", help="删除题目（软删除）")
    delete_parser.add_argument("--mode", help="指定模式，不指定则删除所有")
    delete_parser.add_argument("--confirm", action="store_true", help="确认删除操作")
    
    # 硬删除题目命令
    hard_delete_parser = subparsers.add_parser("hard-delete", help="硬删除题目（完全删除）")
    hard_delete_parser.add_argument("--mode", help="指定模式，不指定则删除所有")
    hard_delete_parser.add_argument("--confirm", action="store_true", help="确认删除操作")
    
    # 恢复题目命令
    restore_parser = subparsers.add_parser("restore", help="恢复被删除的题目")
    restore_parser.add_argument("--mode", help="指定模式，不指定则恢复所有")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # 初始化数据库
    if args.command == "init":
        init_database()
        print("✅ 数据库初始化完成")
        return
    
    # 测试ChatGPT连接
    if args.command == "test":
        try:
            from app.chatgpt_generator import ChatGPTGenerator
            generator = ChatGPTGenerator()
            print("✅ ChatGPT API配置正确")
            print(f"模型: {generator.model}")
            print(f"API地址: {generator.base_url}")
        except Exception as e:
            print(f"❌ ChatGPT API配置错误: {str(e)}")
            print("请检查环境变量: OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL")
        return
    
    # 需要数据库连接的命令
    db = SessionLocal()
    try:
        manager = QuestionManager(db)
        
        if args.command == "generate":
            # 读取自定义提示词
            custom_prompt = None
            if args.prompt:
                try:
                    with open(args.prompt, 'r', encoding='utf-8') as f:
                        custom_prompt = f.read()
                    print(f"✅ 已加载自定义提示词: {args.prompt}")
                except Exception as e:
                    print(f"❌ 读取提示词文件失败: {str(e)}")
                    return
            
            print(f"🚀 开始生成 {args.count} 道 {args.mode} 题目...")
            
            result = manager.generate_and_save_questions(
                mode=args.mode,
                count=args.count,
                custom_prompt=custom_prompt
            )
            
            if result["success"]:
                print(f"✅ 题目生成完成!")
                print(f"   生成批次ID: {result['generation_id']}")
                print(f"   成功保存: {result['success_count']} 道")
                print(f"   失败: {result['failed_count']} 道")
                print(f"   模式: {result['mode']}")
            else:
                print(f"❌ 题目生成失败: {result.get('error', '未知错误')}")
        
        elif args.command == "stats":
            stats = manager.get_question_stats()
            print("📊 题目统计信息:")
            print(f"   总题目数: {stats['total_questions']}")
            print("\n按模式分布:")
            for mode, count in stats['by_mode'].items():
                print(f"   {mode}: {count} 道")
            print("\n按阶段分布:")
            for stage, count in stats['by_stage'].items():
                print(f"   {stage}: {count} 道")
            print("\n按来源分布:")
            for source, count in stats['by_source'].items():
                print(f"   {source}: {count} 道")
        
        elif args.command == "upload":
            print(f"📤 开始上传题目文件: {args.file}")
            result = manager.upload_questions_from_json(args.file)
            
            if result["success"]:
                print(f"✅ 题目上传完成!")
                print(f"   处理总数: {result['total_processed']}")
                print(f"   成功: {result['success_count']} 道")
                print(f"   失败: {result['failed_count']} 道")
                if result['failed_questions']:
                    print("\n失败的题目:")
                    for failed in result['failed_questions'][:5]:  # 只显示前5个
                        print(f"   题目 {failed['index']}: {failed['error']}")
            else:
                print(f"❌ 题目上传失败: {result.get('error', '未知错误')}")
        
        elif args.command == "export":
            print(f"📥 开始导出题目...")
            result = manager.export_questions_to_json(args.mode, args.output)
            
            if result["success"]:
                print(f"✅ 题目导出完成!")
                print(f"   导出数量: {result['exported_count']}")
                print(f"   输出文件: {result['output_file']}")
                if result['mode_filter']:
                    print(f"   模式过滤: {result['mode_filter']}")
            else:
                print(f"❌ 题目导出失败: {result.get('error', '未知错误')}")
        
        elif args.command == "delete":
            print(f"🗑️ 开始删除题目...")
            if not args.confirm:
                print("❌ 删除操作需要确认！请添加 --confirm 参数")
                print("示例: python update_questions.py delete --mode 综合练习 --confirm")
                return
            
            result = manager.delete_questions(args.mode, args.confirm)
            
            if result["success"]:
                print(f"✅ {result['message']}")
                print(f"   删除数量: {result['deleted_count']}")
                if result.get('mode_filter'):
                    print(f"   模式过滤: {result['mode_filter']}")
            else:
                print(f"❌ 删除失败: {result.get('error', '未知错误')}")
        
        elif args.command == "hard-delete":
            print(f"💀 开始硬删除题目...")
            if not args.confirm:
                print("❌ 硬删除操作需要确认！请添加 --confirm 参数")
                print("示例: python update_questions.py hard-delete --mode 综合练习 --confirm")
                return
            
            result = manager.hard_delete_questions(args.mode, args.confirm)
            
            if result["success"]:
                print(f"✅ {result['message']}")
                print(f"   删除数量: {result['deleted_count']}")
                if result.get('mode_filter'):
                    print(f"   模式过滤: {result['mode_filter']}")
            else:
                print(f"❌ 硬删除失败: {result.get('error', '未知错误')}")
        
        elif args.command == "restore":
            print(f"🔄 开始恢复题目...")
            result = manager.restore_questions(args.mode)
            
            if result["success"]:
                print(f"✅ {result['message']}")
                print(f"   恢复数量: {result['restored_count']}")
                if result.get('mode_filter'):
                    print(f"   模式过滤: {result['mode_filter']}")
            else:
                print(f"❌ 恢复失败: {result.get('error', '未知错误')}")
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
