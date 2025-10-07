'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { QuestionData } from '../../types/question';

function QuestionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState('综合练习');
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [raiseSize, setRaiseSize] = useState<string | null>(null);
  const [actionHistoryScrollTop, setActionHistoryScrollTop] = useState(0);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam) {
      setMode(decodeURIComponent(modeParam));
    }
    
    // 根据模式生成不同的测试题目数据
    let testQuestion: QuestionData;
    
    if (modeParam === '价值练习') {
      testQuestion = {
        id: 1,
        mode: '价值练习',
        position: 'CO',
        stage: 'flop',
        stacks: [100, 95, 100, 110, 50, 25], // [UTG, UTG1, CO, BTN, SB, BB]
        action_history: {
          preflop: ['UTG raise 3', 'UTG1 fold', 'CO call'],
          flop: [],
          turn: [],
          river: []
        },
        hole_cards: ['AA', 'KK'], // 强牌
        board: ['Ac', '7h', '2d'], // 公共牌（翻牌）
        ref_solution: { call: 20, raise: 80 }
      };
    } else if (modeParam === 'Bluff练习') {
      testQuestion = {
        id: 2,
        mode: 'Bluff练习',
        position: 'BTN',
        stage: 'turn',
        stacks: [100, 95, 110, 100, 50, 25], // [UTG, UTG1, CO, BTN, SB, BB]
        action_history: {
          preflop: ['UTG raise 3', 'UTG1 fold', 'CO call', 'BTN call'],
          flop: ['UTG bet 5', 'CO call', 'BTN call'],
          turn: [],
          river: []
        },
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
        stage: 'flop',
        stacks: [100, 95, 110, 100, 50, 25], // [UTG, UTG1, CO, BTN, SB, BB]
        action_history: {
          preflop: ['UTG raise 3', 'UTG1 fold', 'CO call', 'BTN raise 6', 'SB fold', 'BB fold', 'UTG raise 20', 'CO fold'],
          flop: [],
          turn: [],
          river: []
        },
        hole_cards: ['As', 'Kh'], // 中等牌力
        board: ['Ac', '7h', '2d'], // 公共牌（翻牌）
        ref_solution: { call: 40, raise: 60 }
      };
    }
    
    setQuestionData(testQuestion);
  }, [searchParams]);

  // 解析行动历史
  const parseActionHistory = (actionHistory: { preflop: string[]; flop: string[]; turn: string[]; river: string[] }) => {
    const result: Record<string, any> = {};
    
    Object.entries(actionHistory).forEach(([stage, actions]) => {
      result[stage] = actions.map(actionStr => {
        const parts = actionStr.split(' ');
        const position = parts[0];
        const action = parts[1];
        const amount = parts[2] ? parseInt(parts[2]) : undefined;
        return { position, action, amount };
      });
    });
    
    return result;
  };

  // 获取玩家在特定阶段的行动
  const getPlayerActionsByStage = (parsedActions: any, playerPosition: string) => {
    const stages = ['preflop', 'flop', 'turn', 'river'];
    return stages.map(stage => {
      const actions = parsedActions[stage] || [];
      return actions.filter((action: any) => action.position === playerPosition);
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

  // 格式化玩家行动历史
  const formatPlayerActionHistory = (playerPosition: string, parsedActions: any) => {
    const stages = ['preflop', 'flop', 'turn', 'river'];
    return stages.map(stage => {
      const actions = parsedActions[stage] || [];
      const playerActions = actions.filter((action: any) => action.position === playerPosition);
      return playerActions.map((action: any) => {
        if (action.action === 'raise') {
          return `${action.action} ${action.amount}bb`;
        }
        return action.action;
      }).join(' -> ');
    });
  };

  // 获取所有行动历史（按顺序）
  const getAllActionHistory = (parsedActions: any) => {
    const stages = ['preflop', 'flop', 'turn', 'river'];
    const allActions: any[] = [];
    
    stages.forEach(stage => {
      const actions = parsedActions[stage] || [];
      actions.forEach((action: any) => {
        allActions.push({
          ...action,
          stage,
          displayText: action.action === 'raise' ? `${action.position} ${action.action} ${action.amount}bb` : `${action.position} ${action.action}`
        });
      });
    });
    
    return allActions;
  };

  // 获取行动方块颜色
  const getActionBlockColor = (action: any) => {
    switch (action.action) {
      case 'raise':
        return '#fbbf24'; // 黄色
      case 'call':
        return '#60a5fa'; // 蓝色
      case 'fold':
        return 'rgba(156, 163, 175, 0.3)'; // 灰色（透明度）
      default:
        return '#9ca3af';
    }
  };

  // 滚动控制函数
  const scrollActionHistory = (direction: 'up' | 'down') => {
    const scrollAmount = 40;
    const newScrollTop = direction === 'up' 
      ? Math.max(0, actionHistoryScrollTop - scrollAmount)
      : actionHistoryScrollTop + scrollAmount;
    setActionHistoryScrollTop(newScrollTop);
  };

  return (
    <>
      {questionData ? (
        (() => {
          const { position, stacks, action_history, hole_cards, board, ref_solution, stage } = questionData;
          const parsedActions = parseActionHistory(action_history);
          const dealerPosition = calculateDealerPosition();
          const positionNames = ['UTG', 'UTG1', 'CO', 'BTN', 'SB', 'BB'];
          const allActions = getAllActionHistory(parsedActions);

          return (
            <div style={{ 
              height: '100vh', 
              backgroundColor: '#065f46', 
              display: 'flex',
              overflow: 'hidden'
            }}>
              {/* 左侧区域 (2/3) */}
              <div style={{ 
                width: '66.67%', 
                display: 'flex',
                flexDirection: 'column',
                height: '100vh'
              }}>
                {/* 顶部信息栏 */}
                <div style={{ 
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                    color: 'white', 
                    padding: '8px 24px', 
                    borderRadius: '8px' 
                  }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
                      {questionData.mode} - {stage.toUpperCase()}
                    </h2>
                  </div>
                  
                  {/* 返回按钮 */}
                  <button 
                    onClick={() => window.history.back()}
                    style={{ 
                      position: 'absolute',
                      left: '20px',
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

                {/* 牌桌区域 (3/4) */}
                <div style={{ 
                  flex: '3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{ 
                    position: 'relative', 
                    width: '80%', 
                    height: '80%' 
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
                      const pos = getPlayerPosition(index);
                      const isDealer = index === dealerPosition;
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
                            {isCurrentPlayer && (
                              <div style={{ color: '#fbbf24' }}>Your Turn</div>
                            )}
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

                {/* 行动选择区域 (1/4) */}
                <div style={{ 
                  flex: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  padding: '20px'
                }}>
                  {/* 主要行动按钮 */}
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <button
                      onClick={() => setSelectedAction('call')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: selectedAction === 'call' ? '#60a5fa' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        minWidth: '80px'
                      }}
                    >
                      Call
                    </button>
                    <button
                      onClick={() => setSelectedAction('raise')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: selectedAction === 'raise' ? '#fbbf24' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        minWidth: '80px'
                      }}
                    >
                      Raise
                    </button>
                    <button
                      onClick={() => setSelectedAction('fold')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: selectedAction === 'fold' ? '#f87171' : '#374151',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        minWidth: '80px'
                      }}
                    >
                      Fold
                    </button>
                  </div>

                  {/* Raise尺寸选择 */}
                  {selectedAction === 'raise' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <div style={{ color: 'white', fontSize: '14px', marginBottom: '8px' }}>选择尺寸:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          onClick={() => setRaiseSize('1/3')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: raiseSize === '1/3' ? '#fbbf24' : '#4b5563',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minWidth: '100px'
                          }}
                        >
                          1/3 pot
                        </button>
                        <button
                          onClick={() => setRaiseSize('1/2')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: raiseSize === '1/2' ? '#fbbf24' : '#4b5563',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minWidth: '100px'
                          }}
                        >
                          1/2 pot
                        </button>
                        <button
                          onClick={() => setRaiseSize('2/3')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: raiseSize === '2/3' ? '#fbbf24' : '#4b5563',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minWidth: '100px'
                          }}
                        >
                          2/3 pot
                        </button>
                        <button
                          onClick={() => setRaiseSize('1')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: raiseSize === '1' ? '#fbbf24' : '#4b5563',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            minWidth: '100px'
                          }}
                        >
                          1 pot
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 提交按钮 */}
                  {selectedAction && (selectedAction !== 'raise' || raiseSize) && (
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginTop: '16px'
                      }}
                    >
                      提交 {selectedAction} {raiseSize && `(${raiseSize} pot)`}
                    </button>
                  )}
                </div>
              </div>

              {/* 右侧区域 (1/3) */}
              <div style={{ 
                width: '33.33%', 
                backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                display: 'flex',
                height: '100vh'
              }}>
                {/* 行动历史栏（左侧窄列） */}
                <div style={{ 
                  width: '120px',
                  padding: '20px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRight: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {/* 上滚动按钮 */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <button
                      onClick={() => scrollActionHistory('up')}
                      style={{
                        width: '30px',
                        height: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      ▲
                    </button>
                  </div>
                  
                  {/* 行动方块容器 */}
                  <div style={{ 
                    flex: '1',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '8px', 
                    padding: '8px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      transform: `translateY(-${actionHistoryScrollTop}px)`,
                      transition: 'transform 0.2s ease'
                    }}>
                      {allActions.map((action, index) => (
                        <div key={index} style={{ 
                          marginBottom: '6px',
                          padding: '6px 4px',
                          backgroundColor: getActionBlockColor(action),
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: action.action === 'fold' ? 'rgba(255, 255, 255, 0.7)' : 'white',
                          textAlign: 'center',
                          minHeight: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1.2'
                        }}>
                          {action.displayText}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 下滚动按钮 */}
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '10px'
                  }}>
                    <button
                      onClick={() => scrollActionHistory('down')}
                      style={{
                        width: '30px',
                        height: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* 玩家信息列（右侧） */}
                <div style={{ 
                  flex: '1',
                  padding: '20px'
                }}>
                  <h3 style={{ 
                    color: 'white', 
                    fontSize: '16px', 
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    玩家信息
                  </h3>
                  
                  <div style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '8px', 
                    padding: '12px',
                    height: 'calc(100% - 50px)',
                    overflowY: 'auto'
                  }}>
                    {positionNames.map((posName, index) => {
                      const stack = stacks[index];
                      const actionHistory = formatPlayerActionHistory(posName, parsedActions);
                      const isCurrentPlayer = posName === position;
                      
                      return (
                        <div key={posName} style={{ 
                          marginBottom: '12px',
                          padding: '8px',
                          backgroundColor: isCurrentPlayer ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                          border: isCurrentPlayer ? '1px solid #fbbf24' : 'none'
                        }}>
                          <div style={{ 
                            color: isCurrentPlayer ? '#fbbf24' : 'white',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            marginBottom: '4px'
                          }}>
                            {posName}({stack}bb)
                          </div>
                          <div style={{ fontSize: '11px', color: '#d1d5db' }}>
                            <div>Preflop: {actionHistory[0] || '-'}</div>
                            <div>Flop: {actionHistory[1] || '-'}</div>
                            <div>Turn: {actionHistory[2] || '-'}</div>
                            <div>River: {actionHistory[3] || '-'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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