import React from 'react';
import { QuestionData, POSITION_NAMES } from '../types/question';
import { parseActionHistory, calculateDealerPosition, getPlayerPosition, getActionText, getActionColor } from '../utils/pokerUtils';

interface PokerTableProps {
  questionData: QuestionData;
}

export default function PokerTable({ questionData }: PokerTableProps) {
  const { position, stacks, action_history, hole_cards, board } = questionData;
  
  // 解析行动历史
  const actions = parseActionHistory(action_history);
  
  // 计算Dealer位置
  const dealerPosition = calculateDealerPosition(position);
  
  // 创建行动映射
  const actionMap = new Map();
  actions.forEach(action => {
    actionMap.set(action.position, action);
  });

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center">
      {/* 顶部信息栏 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-50 text-white px-6 py-2 rounded-lg">
          <h2 className="text-lg font-bold text-center">{questionData.mode}</h2>
        </div>
      </div>

      {/* 牌桌容器 */}
      <div className="relative w-full max-w-4xl h-96">
        {/* 椭圆形牌桌 */}
        <div className="absolute inset-0 bg-green-800 rounded-full border-8 border-yellow-600 shadow-2xl"></div>
        
        {/* Dealer按钮位置 */}
        <div 
          className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-400"
          style={{
            top: `${getPlayerPosition(dealerPosition).top}%`,
            left: getPlayerPosition(dealerPosition).left,
            transform: getPlayerPosition(dealerPosition).transform
          }}
        >
          <span className="text-xs font-bold text-gray-800">D</span>
        </div>

        {/* 6个玩家位置 */}
        {POSITION_NAMES.map((posName, index) => {
          const isCurrentPlayer = posName === position;
          const stack = stacks[index];
          const action = actionMap.get(posName);
          const pos = getPlayerPosition(index);
          
          return (
            <div
              key={posName}
              className="absolute"
              style={{
                top: `${pos.top}%`,
                left: pos.left,
                transform: pos.transform
              }}
            >
              {/* 玩家头像 */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${
                isCurrentPlayer ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                <span className="text-white text-sm font-bold">
                  {isCurrentPlayer ? 'YOU' : index + 1}
                </span>
              </div>
              
              {/* 玩家信息 */}
              <div className="mt-2 text-center text-white text-xs">
                <div className="font-bold">{posName}</div>
                <div className="text-yellow-300">{stack}bb</div>
                {action && (
                  <div className={getActionColor(action)}>
                    {getActionText(action)}
                  </div>
                )}
                {!action && !isCurrentPlayer && (
                  <div className="text-gray-300">Waiting</div>
                )}
                {isCurrentPlayer && !action && (
                  <div className="text-yellow-300">Your Turn</div>
                )}
              </div>
              
              {/* 手牌显示（仅当前玩家） */}
              {isCurrentPlayer && hole_cards.length > 0 && (
                <div className="mt-2 flex justify-center space-x-1">
                  {hole_cards.map((card, cardIndex) => (
                    <div key={cardIndex} className="w-6 h-8 bg-white rounded border border-gray-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-black">{card}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 公共牌区域 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex space-x-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="w-8 h-12 rounded border-2 border-gray-400 flex items-center justify-center">
                {board[index] ? (
                  <span className="text-xs font-bold text-black">{board[index]}</span>
                ) : (
                  <div className="w-6 h-10 bg-blue-600 rounded"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底池信息 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-8">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
            <div className="text-center">
              <div className="text-sm">Pot: 15bb</div>
              <div className="text-xs text-gray-300">Your Stack: {stacks[POSITION_NAMES.indexOf(position as any)]}bb</div>
            </div>
          </div>
        </div>
      </div>

      {/* 返回按钮 */}
      <div className="absolute top-4 left-4">
        <button 
          onClick={() => window.history.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          返回主菜单
        </button>
      </div>
    </div>
  );
}
