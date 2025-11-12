import React from 'react';

interface CardBackProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function CardBack({ size = 'medium', className = '' }: CardBackProps) {
  const sizeClasses = {
    small: 'w-8 h-12 text-xs',
    medium: 'w-12 h-16 text-sm',
    large: 'w-16 h-20 text-base'
  };

  return (
    <div 
      className={`bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-lg border-2 border-blue-700 shadow-lg relative overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {/* 牌背图案 - 经典蓝色背景带纹理 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* 中心图案 */}
        <div className="w-6 h-8 bg-white rounded opacity-20"></div>
      </div>
      
      {/* 边框装饰 */}
      <div className="absolute inset-1 border border-blue-400 rounded opacity-30"></div>
      
      {/* 四个角的装饰 */}
      <div className="absolute top-1 left-1 w-2 h-2 border border-blue-400 rounded-sm opacity-40"></div>
      <div className="absolute top-1 right-1 w-2 h-2 border border-blue-400 rounded-sm opacity-40"></div>
      <div className="absolute bottom-1 left-1 w-2 h-2 border border-blue-400 rounded-sm opacity-40"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 border border-blue-400 rounded-sm opacity-40"></div>
    </div>
  );
}
