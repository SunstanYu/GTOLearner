import React from 'react';

interface PlayingCardProps {
  card: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// 扑克牌花色和点数的映射
const cardMapping: Record<string, { suit: string; rank: string; color: string }> = {
  'As': { suit: '♠', rank: 'A', color: 'text-black' },
  'Ah': { suit: '♥', rank: 'A', color: 'text-red-600' },
  'Ad': { suit: '♦', rank: 'A', color: 'text-red-600' },
  'Ac': { suit: '♣', rank: 'A', color: 'text-black' },
  'Ks': { suit: '♠', rank: 'K', color: 'text-black' },
  'Kh': { suit: '♥', rank: 'K', color: 'text-red-600' },
  'Kd': { suit: '♦', rank: 'K', color: 'text-red-600' },
  'Kc': { suit: '♣', rank: 'K', color: 'text-black' },
  'Qs': { suit: '♠', rank: 'Q', color: 'text-black' },
  'Qh': { suit: '♥', rank: 'Q', color: 'text-red-600' },
  'Qd': { suit: '♦', rank: 'Q', color: 'text-red-600' },
  'Qc': { suit: '♣', rank: 'Q', color: 'text-black' },
  'Js': { suit: '♠', rank: 'J', color: 'text-black' },
  'Jh': { suit: '♥', rank: 'J', color: 'text-red-600' },
  'Jd': { suit: '♦', rank: 'J', color: 'text-red-600' },
  'Jc': { suit: '♣', rank: 'J', color: 'text-black' },
  'Ts': { suit: '♠', rank: 'T', color: 'text-black' },
  'Th': { suit: '♥', rank: 'T', color: 'text-red-600' },
  'Td': { suit: '♦', rank: 'T', color: 'text-red-600' },
  'Tc': { suit: '♣', rank: 'T', color: 'text-black' },
  '9s': { suit: '♠', rank: '9', color: 'text-black' },
  '9h': { suit: '♥', rank: '9', color: 'text-red-600' },
  '9d': { suit: '♦', rank: '9', color: 'text-red-600' },
  '9c': { suit: '♣', rank: '9', color: 'text-black' },
  '8s': { suit: '♠', rank: '8', color: 'text-black' },
  '8h': { suit: '♥', rank: '8', color: 'text-red-600' },
  '8d': { suit: '♦', rank: '8', color: 'text-red-600' },
  '8c': { suit: '♣', rank: '8', color: 'text-black' },
  '7s': { suit: '♠', rank: '7', color: 'text-black' },
  '7h': { suit: '♥', rank: '7', color: 'text-red-600' },
  '7d': { suit: '♦', rank: '7', color: 'text-red-600' },
  '7c': { suit: '♣', rank: '7', color: 'text-black' },
  '6s': { suit: '♠', rank: '6', color: 'text-black' },
  '6h': { suit: '♥', rank: '6', color: 'text-red-600' },
  '6d': { suit: '♦', rank: '6', color: 'text-red-600' },
  '6c': { suit: '♣', rank: '6', color: 'text-black' },
  '5s': { suit: '♠', rank: '5', color: 'text-black' },
  '5h': { suit: '♥', rank: '5', color: 'text-red-600' },
  '5d': { suit: '♦', rank: '5', color: 'text-red-600' },
  '5c': { suit: '♣', rank: '5', color: 'text-black' },
  '4s': { suit: '♠', rank: '4', color: 'text-black' },
  '4h': { suit: '♥', rank: '4', color: 'text-red-600' },
  '4d': { suit: '♦', rank: '4', color: 'text-red-600' },
  '4c': { suit: '♣', rank: '4', color: 'text-black' },
  '3s': { suit: '♠', rank: '3', color: 'text-black' },
  '3h': { suit: '♥', rank: '3', color: 'text-red-600' },
  '3d': { suit: '♦', rank: '3', color: 'text-red-600' },
  '3c': { suit: '♣', rank: '3', color: 'text-black' },
  '2s': { suit: '♠', rank: '2', color: 'text-black' },
  '2h': { suit: '♥', rank: '2', color: 'text-red-600' },
  '2d': { suit: '♦', rank: '2', color: 'text-red-600' },
  '2c': { suit: '♣', rank: '2', color: 'text-black' },
};

export default function PlayingCard({ card, size = 'medium', className = '' }: PlayingCardProps) {
  const cardInfo = cardMapping[card];
  
  const sizeClasses = {
    small: 'w-8 h-12 text-xs',
    medium: 'w-12 h-16 text-sm',
    large: 'w-16 h-20 text-base'
  };
  
  if (!cardInfo) {
    // 如果找不到对应的牌，显示原始字符串
    return (
      <div className={`bg-white rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center relative ${sizeClasses[size]} ${className}`}>
        <span className="text-xs font-bold text-gray-600">{card}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col items-center justify-center relative ${sizeClasses[size]} ${className}`}>
      {/* 左上角的点数（更大） */}
      <div className={`absolute top-1 left-1 ${cardInfo.color}`}>
        <span className="font-bold text-lg">{cardInfo.rank}</span>
      </div>
      
      {/* 右下角的大花色 */}
      <div className={`absolute bottom-1 right-1 ${cardInfo.color} text-2xl font-bold`}>
        {cardInfo.suit}
      </div>
    </div>
  );
}
