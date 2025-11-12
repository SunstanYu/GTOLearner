#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试AI对话功能的脚本
"""
import requests
import json

def test_ai_chat():
    """测试AI对话API"""
    base_url = "http://localhost:8000"
    
    # 1. 首先获取一个题目
    print("1. 获取题目...")
    response = requests.get(f"{base_url}/api/v1/questions?mode=synthesis")
    
    if response.status_code != 200:
        print(f"获取题目失败: {response.status_code}")
        return
    
    question_data = response.json()
    question_id = question_data["id"]
    print(f"获取题目成功，ID: {question_id}")
    print(f"   位置: {question_data['position']}")
    print(f"   阶段: {question_data['stage']}")
    print(f"   手牌: {question_data['hole_cards']}")
    
    # 2. 测试AI对话
    print("\n2. 测试AI对话...")
    chat_data = {
        "question_id": question_id,
        "message": "我应该怎么玩这手牌？"
    }
    
    response = requests.post(
        f"{base_url}/api/v1/chat",
        headers={"Content-Type": "application/json"},
        data=json.dumps(chat_data)
    )
    
    if response.status_code == 200:
        result = response.json()
        if result["success"]:
            print("AI对话成功!")
            print(f"AI回复: {result['response']}")
        else:
            print(f"AI对话失败: {result.get('error', '未知错误')}")
    else:
        print(f"API请求失败: {response.status_code}")
        print(f"响应内容: {response.text}")

if __name__ == "__main__":
    test_ai_chat()
