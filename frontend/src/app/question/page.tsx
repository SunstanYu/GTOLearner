'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import PokerTable from '../../components/PokerTable';
import { QuestionData } from '../../types/question';

function QuestionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('综合练习');
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    console.log('URL参数:', modeParam);
    if (modeParam) {
      setMode(decodeURIComponent(modeParam));
      console.log('设置模式为:', decodeURIComponent(modeParam));
    }
    
    // 根据模式生成不同的测试题目数据
    let testQuestion: QuestionData;
    
    if (modeParam === '价值练习') {
      testQuestion = {
        id: 1,
        mode: '价值练习',
        position: 'CO',
        stacks: [100, 95, 100, 110, 50, 25], // [UTG, UTG1, CO, BTN, SB, BB]
        action_history: ['UTG raise 3', 'UTG1 fold'], // 我之前的行动
        hole_cards: ['AA', 'KK'], // 强牌
        board: ['Ac', '7h', '2d'], // 公共牌（翻牌）
        ref_solution: { call: 20, raise: 80 }
      };
    } else if (modeParam === 'Bluff练习') {
      testQuestion = {
        id: 2,
        mode: 'Bluff练习',
        position: 'BTN',
        stacks: [100, 95, 110, 100, 50, 25], // [UTG, UTG1, CO, BTN, SB, BB]
        action_history: ['UTG raise 3', 'UTG1 fold', 'CO call'], // 我之前的行动
        hole_cards: ['72o'], // 弱牌
        board: ['Ac', '7h', '2d', 'Ks'], // 公共牌（转牌）
        ref_solution: { fold: 100 }
      };
    } else {
      // 综合练习
      testQuestion = {
        id: 3,
        mode: '综合练习',
        position: 'BTN',
        stacks: [100, 95, 110, 100, 50, 25], // [UTG, UTG1, CO, BTN, SB, BB]
        action_history: ['UTG raise 3', 'UTG1 fold', 'CO call'], // 我之前的行动
        hole_cards: ['As', 'Kh'], // 中等牌力
        board: ['Ac', '7h', '2d'], // 公共牌（翻牌）
        ref_solution: { call: 40, raise: 60 }
      };
    }
    
    setQuestionData(testQuestion);
  }, [searchParams]);

  // 解析行动历史
  const parseActionHistory = (actionHistory: string[]) => {
    return actionHistory.map(actionStr => {
      const parts = actionStr.split(' ');
      const position = parts[0];
      const action = parts[1];
      const amount = parts[2] ? parseInt(parts[2]) : undefined;
      return { position, action, amount };
    });
  };

  // 计算Dealer位置
  const calculateDealerPosition = () => {
    const positions = ['UTG', 'UTG1', 'CO', 'BTN', 'SB', 'BB'];
    return positions.indexOf('BTN'); // = 3
  };

  // 获取玩家位置坐标
  const getPlayerPosition = (index: number) => {
    const positions = [
      // 0 UTG - 顶部中
      { top: '8%',  left: '50%', transform: 'translate(-50%, -50%)' },
      // 1 UTG1 - 右上
      { top: '22%', left: '80%', transform: 'translate(-50%, -50%)' },
      // 2 CO - 右侧中
      { top: '68%', left: '80%', transform: 'translate(-50%, -50%)' },
      // 3 BTN - 底部中（玩家在边缘而非中间）
      { top: '88%', left: '50%', transform: 'translate(-50%, -50%)' },
      // 4 SB - 左侧中
      { top: '68%', left: '20%', transform: 'translate(-50%, -50%)' },
      // 5 BB - 左上
      { top: '22%', left: '20%', transform: 'translate(-50%, -50%)' },
    ];
    return positions[index];
  };

  // 获取行动显示文本
  const getActionText = (action: any) => {
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
  };

  // 获取行动颜色
  const getActionColor = (action: any) => {
    switch (action.action) {
      case 'call':
        return '#60a5fa'; // blue-400
      case 'raise':
        return '#fbbf24'; // yellow-400
      case 'fold':
        return '#f87171'; // red-400
      default:
        return '#9ca3af'; // gray-400
    }
  };

  return (
    <>
      {questionData ? (
        (() => {
          const { position, stacks, action_history, hole_cards, board, ref_solution } = questionData;
          const actions = parseActionHistory(action_history);
          const dealerPosition = calculateDealerPosition();
          const actionMap = new Map();
          actions.forEach(action => {
            actionMap.set(action.position, action);
          });
          const positionNames = ['UTG', 'UTG1', 'CO', 'BTN', 'SB', 'BB'];

          return (
            <div style={{ minHeight: '100vh', backgroundColor: '#065f46', position: 'relative' }}>
          {/* 顶部信息栏 */}
          <div style={{ 
            position: 'absolute', 
            top: '16px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 10
          }}>
            <div style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
              color: 'white', 
              padding: '8px 24px', 
              borderRadius: '8px' 
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
                {questionData.mode}
              </h2>
            </div>
          </div>

          {/* 牌桌容器 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            padding: '20px'
          }}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '800px', 
              height: '400px' 
            }}>
              {/* 椭圆形牌桌 */}
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundColor: '#166534', 
                borderRadius: '50%', 
                border: '8px solid #ca8a04', 
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)' 
              }}></div>
              

              {/* 6个玩家位置 */}
              {positionNames.map((posName, index) => {
                const isCurrentPlayer = posName === position;
                const stack = stacks[index];
                const action = actionMap.get(posName);
                const pos = getPlayerPosition(index);
                
                const isDealer = index === dealerPosition;

                // 头像尺寸（你原来：当前玩家更大）
                const avatarSize = isCurrentPlayer ? 64 : 48;
              
                return (
                  <div
                    key={posName}
                    style={{
                      position: 'absolute',
                      top: pos.top,
                      left: pos.left,
                      transform: pos.transform,
                      zIndex: 5
                    }}
                  >
                    {/* 外层包一层，用于相对定位 D 徽标 */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      {/* 玩家头像 */}
                      <div
                        style={{
                          width: `${avatarSize}px`,
                          height: `${avatarSize}px`,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isCurrentPlayer ? '4px solid #fbbf24' : '2px solid white',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                          backgroundColor: isCurrentPlayer ? '#ef4444' : '#3b82f6'
                        }}
                      >
                        <span
                          style={{
                            color: 'white',
                            fontSize: isCurrentPlayer ? '14px' : '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {isCurrentPlayer ? 'YOU' : index + 1}
                        </span>
                      </div>
              
                      {/* Dealer 徽标：头像右侧 8px，垂直居中 */}
                      {isDealer && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '100%',
                            transform: 'translate(8px, -50%)',
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'white',
                            border: '2px solid #9ca3af',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
                          }}
                          title="Dealer"
                        >
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>D</span>
                        </div>
                      )}
                    </div>
              
                    {/* 玩家信息 */}
                    <div
                      style={{
                        marginTop: '8px',
                        textAlign: 'center',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{posName}</div>
                      <div style={{ color: '#fbbf24' }}>{stack}bb</div>
                      {action && <div style={{ color: getActionColor(action) }}>{getActionText(action)}</div>}
                      {!action && !isCurrentPlayer && <div style={{ color: '#9ca3af' }}>Waiting</div>}
                      {isCurrentPlayer && !action && <div style={{ color: '#fbbf24' }}>Your Turn</div>}
                    </div>
              
                    {/* 手牌（仅当前玩家） */}
                    {isCurrentPlayer && hole_cards.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        {hole_cards.map((card, cardIndex) => (
                          <div
                            key={cardIndex}
                            style={{
                              width: '24px',
                              height: '32px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              border: '1px solid #9ca3af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'black' }}>{card}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 底池信息 */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -90px)',
                zIndex: 5
              }}>
                <div style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                  color: 'white', 
                  padding: '8px 16px', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px' }}>Pot: 15bb</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Your Stack: {stacks[positionNames.indexOf(position)]}bb
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

              {/* 公共牌区域 */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                zIndex: 5
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} style={{ 
                      width: '32px', 
                      height: '48px', 
                      borderRadius: '4px', 
                      border: '2px solid #9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: board[index] ? 'white' : 'transparent'
                    }}>
                      {board[index] ? (
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 'bold', 
                          color: 'black' 
                        }}>{board[index]}</span>
                      ) : (
                        <div style={{ 
                          width: '24px', 
                          height: '40px', 
                          backgroundColor: '#2563eb', 
                          borderRadius: '2px' 
                        }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              

          {/* 返回按钮 */}
          <div style={{ 
            position: 'absolute', 
            top: '16px', 
            left: '16px',
            zIndex: 10
          }}>
            <button 
              onClick={() => window.history.back()}
              style={{ 
                backgroundColor: '#4b5563', 
                color: 'white', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                border: 'none',
                cursor: 'pointer'
              }}
            >
              返回主菜单
            </button>
          </div>
        </div>
          );
        })()
      ) : (
        <div style={{ minHeight: '100vh', backgroundColor: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          加载中...
        </div>
      )}
    </>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-900 flex items-center justify-center text-white">加载中...</div>}>
      <QuestionContent />
    </Suspense>
  );
}
