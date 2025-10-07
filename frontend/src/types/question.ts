// 题目数据接口
export interface QuestionData {
  id: number;
  mode: string;
  position: string; // 当前玩家位置
  stage: 'preflop' | 'flop' | 'turn' | 'river'; // 当前阶段
  stacks: number[]; // [UTG, UTG1, CO, BTN, SB, BB] 的筹码量
  action_history: {
    preflop: string[];
    flop: string[];
    turn: string[];
    river: string[];
  }; // 按阶段组织的行动历史
  hole_cards: string[]; // 我的手牌
  board: string[]; // 公共牌
  ref_solution: Record<string, number>; // 参考解决方案
}

// 玩家位置映射
export const POSITION_MAP = {
  'UTG': 0,
  'UTG1': 1, 
  'CO': 2,
  'BTN': 3,
  'SB': 4,
  'BB': 5
} as const;

// 位置名称数组
export const POSITION_NAMES = ['UTG', 'UTG1', 'CO', 'BTN', 'SB', 'BB'] as const;

// 行动解析结果
export interface ActionInfo {
  position: string;
  action: 'call' | 'raise' | 'fold';
  amount?: number; // raise的尺度
}
