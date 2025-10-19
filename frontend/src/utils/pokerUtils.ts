import { QuestionData, ActionInfo, POSITION_MAP, POSITION_NAMES } from '../types/question';

// 解析行动历史
export function parseActionHistory(actionHistory: { preflop: string[]; flop: string[]; turn: string[]; river: string[] }): ActionInfo[] {
  const allActions: string[] = [];
  
  // 合并所有阶段的行动
  allActions.push(...actionHistory.preflop);
  allActions.push(...actionHistory.flop);
  allActions.push(...actionHistory.turn);
  allActions.push(...actionHistory.river);
  
  return allActions.map(actionStr => {
    const parts = actionStr.split(' ');
    const position = parts[0];
    const action = parts[1] as 'call' | 'raise' | 'fold';
    const amount = parts[2] ? parseInt(parts[2]) : undefined;
    
    return {
      position,
      action,
      amount
    };
  });
}

// 计算Dealer位置
export function calculateDealerPosition(playerPosition: string): number {
  const playerIndex = POSITION_MAP[playerPosition as keyof typeof POSITION_MAP];
  // Dealer在玩家位置的左侧
  return (playerIndex + 1) % 6;
}

// 获取玩家在牌桌上的位置坐标
export function getPlayerPosition(index: number): { top: string; left: string; transform: string } {
  const positions = [
    { top: '15%', left: '50%', transform: '-50%' }, // UTG - 顶部中央
    { top: '35%', left: '50%', transform: '-50%' }, // UTG1 - 中上
    { top: '65%', left: '50%', transform: '-50%' }, // CO - 中下
    { top: '85%', left: '50%', transform: '-50%' }, // BTN - 底部中央（玩家）
    { top: '50%', left: '15%', transform: '-50%' }, // SB - 左侧中央
    { top: '50%', left: '85%', transform: '-50%' }, // BB - 右侧中央
  ];
  
  return positions[index];
}

// 获取行动显示文本
export function getActionText(action: ActionInfo): string {
  switch (action.action) {
    case 'call':
      return 'Call';
    case 'raise':
      return `Raise ${action.amount}bb`;
    case 'fold':
      return 'Fold';
    default:
      return 'Waiting';
  }
}

// 获取行动颜色
export function getActionColor(action: ActionInfo): string {
  switch (action.action) {
    case 'call':
      return 'text-blue-300';
    case 'raise':
      return 'text-yellow-300';
    case 'fold':
      return 'text-red-300';
    default:
      return 'text-gray-300';
  }
}
