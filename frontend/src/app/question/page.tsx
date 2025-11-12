'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';
import { QuestionData } from '../../types/question';
import PlayingCard from '../../components/PlayingCard';
import CardBack from '../../components/CardBack';

function QuestionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 添加CSS动画样式
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [mode, setMode] = useState('synthesis');
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [raiseSize, setRaiseSize] = useState<string | null>(null);
  const [actionHistoryScrollTop, setActionHistoryScrollTop] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatScrollTop, setChatScrollTop] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [scrollbarTimeout, setScrollbarTimeout] = useState<NodeJS.Timeout | null>(null);
  const [inputRows, setInputRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);     // 底部输入框
  const [chatAreaHeight, setChatAreaHeight] = useState(0); // 动态存储历史区高度
  const [judgmentResult, setJudgmentResult] = useState<{
    isCorrect: number; // 0=不对, 1=半对, 2=全对
    userAction: string;
    refSolution: Record<string, number>;
    explanation: string;
  } | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // 模式映射：中文显示名称 -> 英文API参数
  const modeMapping: Record<string, string> = {
    '综合练习': 'synthesis',
    '价值练习': 'value',
    'Bluff练习': 'bluff'
  };

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam) {
      const decodedMode = decodeURIComponent(modeParam);
      setMode(decodedMode);
      // 从后端API获取题目，使用映射后的英文模式
      const apiMode = modeMapping[decodedMode] || decodedMode;
      fetchQuestion(apiMode);
    }
  }, [searchParams]);

  // 当显示解释时初始化AI消息
  useEffect(() => {
    if (showExplanation) {
      initializeExplanationMessage();
    }
  }, [showExplanation, judgmentResult]);

  useEffect(() => {
    if (inputAreaRef.current && chatContainerRef.current) {
      const totalHeight = chatContainerRef.current.clientHeight;
      const inputHeight = inputAreaRef.current.clientHeight;
      setChatAreaHeight(totalHeight - inputHeight);
    }
  }, []);
  

  // 从后端获取题目
  const fetchQuestion = async (mode: string) => {
    try {
      // 发起HTTP GET请求
      const response = await fetch(`http://localhost:8000/api/v1/questions?mode=${encodeURIComponent(mode)}`);
      // 检查响应状态
      if (response.ok) {
        const data = await response.json();
        setQuestionData(data);
      } else {
        console.error('Failed to fetch question:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    }
  };

  // 获取下一题
  const fetchNextQuestion = async (currentId: number, mode: string) => {
    try {
      // 使用模式映射将中文模式转换为英文API参数
      const apiMode = modeMapping[mode] || mode;
      const response = await fetch(`http://localhost:8000/api/v1/questions/next/${currentId}?mode=${encodeURIComponent(apiMode)}`);
      if (response.ok) {
        const data = await response.json();
        setQuestionData(data);
        // 重置状态
        resetAnswer();
      } else {
        console.error('Failed to fetch next question:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching next question:', error);
    }
  };

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
      // 0 UTG - 顶部左
      { top: '0%',  left: '30%', transform: 'translate(-50%, -50%)' },
      // 1 UTG1 - 顶侧右
      { top: '0%', left: '70%', transform: 'translate(-50%, -50%)' },
      // 2 CO - 右侧中
      { top: '50%', left: '100%', transform: 'translate(-50%, -50%)' },
      // 3 BTN - 底部右
      { top: '100%', left: '70%', transform: 'translate(-50%, -50%)' },
      // 4 SB - 底部左
      { top: '100%', left: '30%', transform: 'translate(-50%, -50%)' },
      // 5 BB - 左侧中
      { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' },
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

  // 获取行动显示位置
  const getActionDisplayPosition = (posName: string, isDealer: boolean) => {
    switch (posName) {
      case 'UTG':
      case 'UTG1':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px'
        };
      case 'BB':
        return {
          top: '50%',
          left: '100%',
          transform: 'translateY(-50%)',
          marginLeft: '8px'
        };
      case 'CO':
        return {
          top: '50%',
          right: '100%',
          transform: 'translateY(-50%)',
          marginRight: '8px'
        };
      case 'SB':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px'
        };
      case 'BTN':
        return {
          top: isDealer ? '-40px' : '-20px',
          right: '-10px',
          transform: 'translateX(50%)'
        };
      default:
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px'
        };
    }
  };

  // 获取当前阶段各玩家的行动
  const getCurrentStageActions = (parsedActions: any, stage: string) => {
    const actions = parsedActions[stage] || [];
    const playerActions: { [key: string]: string } = {};
    
    actions.forEach((action: any) => {
      const actionText = action.action === 'raise' ? `${action.action} ${action.amount}` : action.action;
      playerActions[action.position] = actionText;
    });
    
    return playerActions;
  };

  // 格式化牌面信息
  const formatBoardCards = (board: string[]) => {
    const suitMap: { [key: string]: string } = {
      'h': '♥', 'd': '♦', 'c': '♣', 's': '♠'
    };
    
    return board.map(card => {
      const rank = card.slice(0, -1);
      const suit = card.slice(-1);
      const suitSymbol = suitMap[suit];
      const color = (suit === 'h' || suit === 'd') ? '#ff4444' : '#000000'; // 红色或黑色
      
      return (
        <span key={card} style={{ color }}>
          {rank}{suitSymbol}
        </span>
      );
    });
  };

  // 获取所有行动历史（按顺序）
  const getAllActionHistory = (parsedActions: any, board: string[], stage: string, position: string) => {
    const stages = ['preflop', 'flop', 'turn', 'river'];
    const allActions: any[] = [];
    
    stages.forEach(currentStage => {
      const actions = parsedActions[currentStage] || [];
      
      // 添加该阶段的行动
      actions.forEach((action: any) => {
        allActions.push({
          ...action,
          stage: currentStage,
          displayText: action.action === 'raise' ? `${action.position} ${action.action} ${action.amount}` : `${action.position} ${action.action}`,
          type: 'action'
        });
      });
      
      // 在阶段结束后添加公共牌信息
      if (currentStage === 'preflop' && board.length >= 3) {
        allActions.push({
          type: 'board',
          stage: 'flop',
          displayText: '',
          cards: board.slice(0, 3)
        });
      } else if (currentStage === 'flop' && board.length >= 4) {
        allActions.push({
          type: 'board',
          stage: 'turn',
          displayText: '',
          cards: board.slice(3, 4)
        });
      } else if (currentStage === 'turn' && board.length >= 5) {
        allActions.push({
          type: 'board',
          stage: 'river',
          displayText: '',
          cards: board.slice(4, 5)
        });
      }
    });
    
    // 添加当前玩家行动提示
    if (stage !== 'river' || parsedActions.river?.length === 0) {
      allActions.push({
        type: 'current',
        displayText: `${position} action`,
        stage: stage
      });
    }
    
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

  // 提交答案到后端判断
  const submitAnswer = async () => {
    console.log('=== 开始提交答案 ===');
    console.log('questionData:', questionData);
    console.log('selectedAction:', selectedAction);
    console.log('raiseSize:', raiseSize);
    
    if (!questionData || !selectedAction) {
      console.log('❌ 缺少必要数据，无法提交');
      return;
    }
    
    let userAction = selectedAction;
    if (selectedAction === 'raise' && raiseSize) {
      // 将 "raise 1/2" 格式转换为 "raise12" 格式
      userAction = `raise${raiseSize.replace('/', '')}`;
      console.log('转换后的userAction:', userAction);
    }
    
    console.log('最终发送的userAction:', userAction);
    console.log('题目ID:', questionData.id);
    console.log('题目ref_solution:', questionData.ref_solution);
    
    try {
      const requestData = {
        question_id: questionData.id,
        user_action: userAction
      };
      
      console.log('📤 发送到后端的数据:', requestData);
      
      const response = await fetch('http://localhost:8000/api/v1/judge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('📡 响应状态:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📥 后端返回的完整数据:', result);
        console.log('📥 后端返回的isCorrect:', result.isCorrect);
        console.log('📥 后端返回的refSolution:', result.refSolution);
        console.log('📥 后端返回的explanation:', result.explanation);
        
        setJudgmentResult(result);
        console.log('✅ 设置judgmentResult成功');
        console.log('🔍 检查isCorrect的值和类型:', result.isCorrect, typeof result.isCorrect);
      } else {
        const errorText = await response.text();
        console.error('❌ 请求失败:', response.status, response.statusText);
        console.error('❌ 错误详情:', errorText);
      }
    } catch (error) {
      console.error('❌ 网络错误:', error);
    }
    
    console.log('=== 提交答案结束 ===');
  };

  // 重置状态
  const resetAnswer = () => {
    setSelectedAction(null);
    setRaiseSize(null);
    setJudgmentResult(null);
    setShowExplanation(false);
    setChatMessages([]);
    setInputMessage('');
    setChatScrollTop(0);
    setShowScrollbar(false);
    setInputRows(1);
  };

  // 计算raise金额
  const calculateRaiseAmount = (raiseSize: string, pot: number): number => {
    switch (raiseSize) {
      case '1/3':
        return Math.round(pot * 0.3);
      case '1/2':
        return Math.round(pot * 0.5);
      case '2/3':
        return Math.round(pot * 0.7);
      case '1':
        return pot;
      default:
        return 0;
    }
  };

  // 根据action类型和pot大小计算raise金额
  const getRaiseAmountByAction = (action: string, pot: number): number | null => {
    switch (action) {
      case 'raise13':
        return Math.round(pot * 0.3);
      case 'raise12':
        return Math.round(pot * 0.5);
      case 'raise23':
        return Math.round(pot * 0.7);
      case 'raise11':
        return pot;
      default:
        return null;
    }
  };

  // 格式化行动名称
  const formatActionName = (action: string, pot?: number) => {
    switch (action) {
      case 'call':
        return 'call';
      case 'raise13':
        if (pot !== undefined) {
          return `raise ${Math.round(pot * 0.3)}`;
        }
        return 'raise 0.3 pot';
      case 'raise12':
        if (pot !== undefined) {
          return `raise ${Math.round(pot * 0.5)}`;
        }
        return 'raise 0.5 pot';
      case 'raise23':
        if (pot !== undefined) {
          return `raise ${Math.round(pot * 0.7)}`;
        }
        return 'raise 0.7 pot';
      case 'raise11':
        if (pot !== undefined) {
          return `raise ${pot}`;
        }
        return 'raise 1 pot';
      case 'fold':
        return 'fold';
      default:
        return action;
    }
  };

  // 获取频率表情和文字
  const getFrequencyDisplay = (level: number) => {
    switch (level) {
      case 1:
        return { emoji: '✅', text: '高' };
      case 2:
        return { emoji: '👌', text: '中' };
      case 3:
        return { emoji: '❌', text: '低' };
      default:
        return { emoji: '❓', text: '未知' };
    }
  };

  // 初始化AI解释消息
  const initializeExplanationMessage = () => {
    if (judgmentResult?.explanation && chatMessages.length === 0) {
      const explanationMessage = {
        id: 'explanation-0',
        type: 'ai' as const,
        content: judgmentResult.explanation,
        timestamp: new Date()
      };
      setChatMessages([explanationMessage]);
    }
  };

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!inputMessage.trim() || !questionData) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // 立即复原输入框大小
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '20px';
      setInputRows(1);
    }
    
    // 调用AI API
    setIsAiTyping(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionData.id,
          message: userMessage.content
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai' as const,
            content: data.response,
            timestamp: new Date()
          };
          
          setChatMessages(prev => [...prev, aiMessage]);
        } else {
          // 处理错误
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            type: 'ai' as const,
            content: data.response || '抱歉，AI服务暂时不可用。',
            timestamp: new Date()
          };
          
          setChatMessages(prev => [...prev, errorMessage]);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('AI对话请求失败:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: '抱歉，网络连接出现问题，请稍后重试。',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // 处理回车键发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // 处理输入框内容变化，自适应高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);
  
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 20;
      const maxHeight = lineHeight * 5;
      const newHeight = Math.min(Math.max(20, scrollHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      setInputRows(Math.ceil(newHeight / lineHeight));
    }
  
    // ✅ 重新计算聊天历史区的可用高度
    if (inputAreaRef.current && chatContainerRef.current) {
      const totalHeight = chatContainerRef.current.clientHeight;
      const inputHeight = inputAreaRef.current.clientHeight;
      setChatAreaHeight(totalHeight - inputHeight);
    }
  };
  

  // 滚动聊天记录
  const scrollChat = (direction: 'up' | 'down') => {
    const scrollAmount = 50;
    const newScrollTop = direction === 'up'
      ? Math.max(0, chatScrollTop - scrollAmount)
      : chatScrollTop + scrollAmount;
    setChatScrollTop(newScrollTop);
    showScrollbarTemporarily();
  };

  // 显示滚动条
  const showScrollbarTemporarily = () => {
    setShowScrollbar(true);
    if (scrollbarTimeout) {
      clearTimeout(scrollbarTimeout);
    }
    const timeout = setTimeout(() => {
      setShowScrollbar(false);
    }, 2000);
    setScrollbarTimeout(timeout);
  };

  // 处理鼠标滚轮
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = chatContainerRef.current;
    if (!container) return;
  
    const chatContainerHeight = container.clientHeight;
    const totalContentHeight = container.scrollHeight;
    const maxScrollTop = Math.max(0, totalContentHeight - chatContainerHeight);
  
    const scrollAmount = e.deltaY > 0 ? 30 : -30;
    const newScrollTop = Math.max(0, Math.min(maxScrollTop, chatScrollTop + scrollAmount));
    setChatScrollTop(newScrollTop);
    showScrollbarTemporarily();
  };
  

  // 计算滚动条高度和位置
  const getScrollbarStyle = () => {
    const container = chatContainerRef.current;
    if (!container) return { display: 'none' };
  
    const chatContainerHeight = container.clientHeight;  // 可见高度
    const totalContentHeight = container.scrollHeight;   // 实际内容高度
  
    if (totalContentHeight <= chatContainerHeight) {
      return { display: 'none' };
    }
  
    const maxScrollTop = totalContentHeight - chatContainerHeight;
    const scrollbarHeight =
      (chatContainerHeight / totalContentHeight) * chatContainerHeight;
    const scrollbarTop =
      (chatScrollTop / maxScrollTop) *
      (chatContainerHeight - scrollbarHeight);
  
    return {
      position: 'absolute' as const,
      right: '4px',
      top: `${scrollbarTop}px`,
      width: '6px',
      height: `${scrollbarHeight}px`,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '3px',
      opacity: showScrollbar ? 1 : 0,
      transition: 'opacity 0.3s ease',
      zIndex: 10
    };
  };

  return (
    <>
      {questionData ? (
        (() => {
          const { position, stacks, action_history, hole_cards, board, ref_solution, stage, hero_cards } = questionData;
          const parsedActions = parseActionHistory(action_history);
          const dealerPosition = calculateDealerPosition();
          const positionNames = ['UTG', 'UTG1', 'CO', 'BTN', 'SB', 'BB'];
          const allActions = getAllActionHistory(parsedActions, board, stage, position);
          const currentStageActions = getCurrentStageActions(parsedActions, stage);

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
                    {/* 香肠形状牌桌 */}
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      backgroundColor: '#166534', 
                      borderRadius: '9999px', 
                      border: '8px solid #ca8a04', 
                      boxShadow: '0 25px 50px rgba(0,0,0,0.3)' 
                    }}></div>
                    
                    {/* 6个玩家位置 */}
                    {positionNames.map((posName, index) => {
                      const isCurrentPlayer = posName === position;
                      const stack = stacks[index];
                      const pos = getPlayerPosition(index);
                      const isDealer = index === dealerPosition;
                      const avatarSize = isCurrentPlayer ? 80 : 64;
                      const playerHeroCards = hero_cards?.[posName] || null;
                      const showCards = judgmentResult !== null; // 有判断结果后显示牌面

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
                          {/* 玩家头像和手牌容器 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
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
                                backgroundColor: isCurrentPlayer ? '#ef4444' : '#3b82f6',
                                position: 'relative'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: isCurrentPlayer ? '16px' : '13px',
                                  fontWeight: 'bold',
                                  lineHeight: '1.1'
                                }}
                              >
                                <div>{posName}</div>
                                <div style={{ fontSize: isCurrentPlayer ? '16px' : '13px', marginTop: '5px'  }}>{stack}</div>
                              </div>
                              
                              {/* Dealer 徽标：头像上方居中 */}
                              {isDealer && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '-30px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
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
                            
                            {/* 手牌显示（仅当前玩家） */}
                            {isCurrentPlayer && hole_cards.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {hole_cards.map((card, cardIndex) => (
                                  <PlayingCard 
                                    key={cardIndex} 
                                    card={card} 
                                    size="medium"
                                    className="shadow-lg"
                                  />
                                ))}
                              </div>
                            )}
                            
                            {/* Hero Cards显示（其他玩家） */}
                            {!isCurrentPlayer && playerHeroCards && playerHeroCards.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {playerHeroCards.map((card, cardIndex) => (
                                  <div 
                                    key={cardIndex} 
                                    style={{ 
                                      position: 'relative',
                                      perspective: '1000px',
                                      width: '48px',  // 明确设置宽度（medium尺寸）
                                      height: '64px',  // 明确设置高度（medium尺寸）
                                    }}
                                  >
                                    <div
                                      style={{
                                        transform: showCards ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                        transition: 'transform 0.6s ease-in-out',
                                        transformStyle: 'preserve-3d',
                                        position: 'relative',
                                        width: '100%',
                                        height: '100%',
                                      }}
                                    >
                                      {/* 牌背 - 初始正面，翻转后背面 */}
                                      <div
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          backfaceVisibility: 'hidden',
                                          WebkitBackfaceVisibility: 'hidden',
                                          transform: 'rotateY(0deg)',
                                        }}
                                      >
                                        <CardBack 
                                          size="medium"
                                          className="shadow-lg"
                                        />
                                      </div>
                                      
                                      {/* 牌面 - 初始背面，翻转后正面 */}
                                      <div
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          width: '100%',
                                          height: '100%',
                                          backfaceVisibility: 'hidden',
                                          WebkitBackfaceVisibility: 'hidden',
                                          transform: 'rotateY(180deg)',
                                        }}
                                      >
                                        <PlayingCard 
                                          card={card} 
                                          size="medium"
                                          className="shadow-lg"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* 当前阶段行动显示 */}
                          {currentStageActions[posName] && (
                            <div style={{
                              position: 'absolute',
                              color: '#fbbf24',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              zIndex: 10,
                              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                              ...getActionDisplayPosition(posName, isDealer)
                            }}>
                              {currentStageActions[posName]}
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
                          <div key={index}>
                            {board[index] ? (
                              <PlayingCard 
                                card={board[index]} 
                                size="medium"
                                className="shadow-lg"
                              />
                            ) : (
                              <div style={{ 
                                width: '48px', 
                                height: '64px', 
                                borderRadius: '8px', 
                                border: '2px solid #9ca3af',
                                backgroundColor: '#2563eb',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <div style={{ 
                                  width: '32px', 
                                  height: '48px', 
                                  backgroundColor: '#1d4ed8', 
                                  borderRadius: '4px',
                                  border: '1px solid #1e40af'
                                }}></div>
                              </div>
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
                          <div style={{ fontSize: '14px' }}>Pot: {questionData.pot}</div>
                          
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
                  {/* 主要行动按钮 - 只在没有结果显示时显示 */}
                  {!judgmentResult && (
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
                  )}

                  {/* Raise尺寸选择 - 只在没有结果显示时显示 */}
                  {selectedAction === 'raise' && !judgmentResult && (
                      <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{ color: 'white', fontSize: '14px' }}>选择尺寸:</div>
                  
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '8px',
                          flexWrap: 'wrap', // 宽度不够时自动换行（可去掉）
                        }}
                      >
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
                          raise {questionData ? calculateRaiseAmount('1/3', questionData.pot) : '...'}
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
                          raise {questionData ? calculateRaiseAmount('1/2', questionData.pot) : '...'}
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
                          raise {questionData ? calculateRaiseAmount('2/3', questionData.pot) : '...'}
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
                          raise {questionData ? calculateRaiseAmount('1', questionData.pot) : '...'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 提交按钮 */}
                  {selectedAction && (selectedAction !== 'raise' || raiseSize) && !judgmentResult && (
                    <button
                      onClick={submitAnswer}
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
                      提交 {selectedAction} {raiseSize && questionData && `(${calculateRaiseAmount(raiseSize, questionData.pot)})`}
                    </button>
                  )}

                  {/* 结果显示 */}
                  {judgmentResult && (
                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      backgroundColor: judgmentResult.isCorrect === 2 ? 'rgba(16, 185, 129, 0.2)' : 
                                      judgmentResult.isCorrect === 1 ? 'rgba(251, 191, 36, 0.2)' : 
                                      'rgba(239, 68, 68, 0.2)',
                      border: `2px solid ${judgmentResult.isCorrect === 2 ? '#10b981' : 
                                        judgmentResult.isCorrect === 1 ? '#fbbf24' : 
                                        '#ef4444'}`,
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: judgmentResult.isCorrect === 2 ? '#10b981' : 
                               judgmentResult.isCorrect === 1 ? '#fbbf24' : 
                               '#ef4444',
                        marginBottom: '12px'
                      }}>
                        {judgmentResult.isCorrect === 2 ? '✅ 正确！' : 
                         judgmentResult.isCorrect === 1 ? '👌 还行' : 
                         '❌ 不正确'}
                      </div>
                      
                      {/* 显示ref_solution信息 - 横向排列的小方框 */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        justifyContent: 'center',
                        marginBottom: '16px'
                      }}>
                        {judgmentResult.refSolution ? Object.entries(judgmentResult.refSolution)
                          .sort(([,a], [,b]) => (a as number) - (b as number)) // 按频率从高到低排序
                          .map(([action, level]) => {
                            const frequency = getFrequencyDisplay(level as number);
                            const actionName = formatActionName(action, questionData?.pot);
                            const isUserAction = (() => {
                              if (selectedAction === 'raise' && raiseSize) {
                                const userAction = `raise${raiseSize.replace('/', '')}`;
                                return userAction === action;
                              }
                              return selectedAction === action;
                            })();
                            
                            return (
                              <div
                                key={action}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  border: isUserAction ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.3)',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: 'white',
                                  textAlign: 'center',
                                  minWidth: '80px'
                                }}
                              >
                                <div style={{ fontSize: '14px', marginBottom: '2px' }}>
                                  {frequency.emoji}
                                </div>
                                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                  {actionName}
                                </div>
                                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                                  {frequency.text}
                                </div>
                              </div>
                            );
                          }) : (
                            <div style={{ color: '#d1d5db', fontSize: '12px' }}>
                              无参考解
                            </div>
                          )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => setShowExplanation(true)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          详细解释
                        </button>
                        <button
                          onClick={() => fetchNextQuestion(questionData.id, questionData.mode)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          下一题
                        </button>
                      </div>
                    </div>
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
                          backgroundColor: action.type === 'board' ? 'rgba(255, 255, 255, 0.15)' : 
                                          action.type === 'current' ? '#fbbf24' : 
                                          getActionBlockColor(action),
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          color: action.type === 'board' ? '#ff4444' : 
                                 action.type === 'current' ? '#000000' :
                                 action.action === 'fold' ? 'rgba(255, 255, 255, 0.7)' : 'white',
                          textAlign: 'center',
                          minHeight: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: '1.2'
                        }}>
                          {action.type === 'board' ? (
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {formatBoardCards(action.cards)}
                            </div>
                          ) : (
                            action.displayText
                          )}
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

                {/* 玩家信息列（右侧）或Copilot风格解释区域 */}
                <div style={{ 
                  flex: '1',
                  height: '100vh',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {showExplanation ? (
                    // Copilot风格的聊天区域
                    <div style={{
                      height: '100%',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}>
                      {/* 顶部关闭按钮 */}
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        zIndex: 10
                      }}>
                        <button
                          onClick={() => setShowExplanation(false)}
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            color: '#64748b',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          ×
                        </button>
                      </div>

                      {/* 聊天区域容器 */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%', // 一定要保证这一层高度为100%
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        {/* 对话历史 */}
                        <div
                          ref={chatContainerRef}
                          style={{
                            flexGrow: 1,          // ✅ 占据剩余空间
                            overflow: 'hidden',   // ✅ 内部滚动逻辑依旧可控
                            position: 'relative',
                            padding: '16px',
                            paddingTop: '60px',
                          }}
                          onWheel={handleWheel}
                        >
                          <div
                            style={{
                              transform: `translateY(-${chatScrollTop}px)`,
                              transition: 'transform 0.2s ease'
                            }}
                          >
                            {chatMessages.map((message, index) => (
                              <div key={message.id} style={{
                                marginBottom: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
                              }}>
                                {message.type === 'user' ? (
                                  // 用户消息：带气泡
                                  <div style={{
                                    maxWidth: '85%',
                                    padding: '12px 16px',
                                    borderRadius: '18px',
                                    backgroundColor: '#0078d4',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word'
                                  }}>
                                    {message.content}
                                  </div>
                                ) : (
                                  // AI消息：无气泡，直接文本
                                  <div style={{
                                    maxWidth: '100%',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    color: '#334155',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word'
                                  }}>
                                    {message.content}
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {/* AI正在输入状态 */}
                            {isAiTyping && (
                              <div style={{
                                marginBottom: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                              }}>
                                <div style={{
                                  maxWidth: '85%',
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  padding: '12px 16px',
                                  borderRadius: '18px 18px 18px 4px',
                                  fontSize: '14px',
                                  lineHeight: '1.4',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <div style={{
                                    display: 'flex',
                                    gap: '4px'
                                  }}>
                                    <div style={{
                                      width: '6px',
                                      height: '6px',
                                      backgroundColor: '#64748b',
                                      borderRadius: '50%',
                                      animation: 'typing 1.4s infinite ease-in-out'
                                    }}></div>
                                    <div style={{
                                      width: '6px',
                                      height: '6px',
                                      backgroundColor: '#64748b',
                                      borderRadius: '50%',
                                      animation: 'typing 1.4s infinite ease-in-out 0.2s'
                                    }}></div>
                                    <div style={{
                                      width: '6px',
                                      height: '6px',
                                      backgroundColor: '#64748b',
                                      borderRadius: '50%',
                                      animation: 'typing 1.4s infinite ease-in-out 0.4s'
                                    }}></div>
                                  </div>
                                  <span>AI正在思考...</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div style={getScrollbarStyle()} />
                        </div>

                        {/* 输入区域 */}
                        <div
                          ref={inputAreaRef}
                          style={{
                            backgroundColor: '#ffffff',
                            borderTop: '1px solid #e2e8f0',
                            padding: '16px',
                          }}
                        >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '8px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '24px',
                          padding: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <textarea
                            ref={textareaRef}
                            value={inputMessage}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="询问关于这道题的任何问题..."
                            style={{
                              flex: '1',
                              border: 'none',
                              outline: 'none',
                              backgroundColor: 'transparent',
                              resize: 'none',
                              fontSize: '14px',
                              lineHeight: '20px',
                              color: '#334155',
                              fontFamily: 'inherit',
                              minHeight: '20px',
                              maxHeight: '100px',
                              overflow: inputRows >= 5 ? 'auto' : 'hidden',
                              padding: '0',
                              margin: '0',
                              width: '100%'
                            }}
                          />
                          <button
                            onClick={sendChatMessage}
                            disabled={!inputMessage.trim() || isAiTyping}
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: (inputMessage.trim() && !isAiTyping) ? '#0078d4' : '#e2e8f0',
                              border: 'none',
                              borderRadius: '50%',
                              cursor: (inputMessage.trim() && !isAiTyping) ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              color: (inputMessage.trim() && !isAiTyping) ? '#ffffff' : '#94a3b8',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isAiTyping ? '⏳' : '➤'}
                          </button>
                        </div>
                      </div>
                     </div>
                    </div>
                  ) : (
                    // 玩家信息显示
                    <div style={{ padding: '20px', height: '100%' }}>
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
                  )}
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