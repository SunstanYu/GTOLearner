'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // 页面加载动画
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleModeClick = (mode: string) => {
    setExiting(true);
    setTimeout(() => {
      router.push(`/question?mode=${encodeURIComponent(mode)}`);
    }, 300);
  };

  const modeButtons = [
    {
      id: 'synthesis',
      name: '综合练习',
      description: 'Comprehensive Training',
      icon: '♠',
      gradient: 'from-poker-cyan via-poker-green to-poker-cyan',
      glowColor: 'rgba(0, 229, 255, 0.4)',
      iconColor: 'text-poker-cyan',
      delay: 'delay-200',
    },
    {
      id: 'value',
      name: '价值练习',
      description: 'Value Training',
      icon: '♣',
      gradient: 'from-poker-gold via-poker-orange to-poker-gold',
      glowColor: 'rgba(255, 215, 0, 0.4)',
      iconColor: 'text-poker-gold',
      delay: 'delay-400',
    },
    {
      id: 'bluff',
      name: 'Bluff练习',
      description: 'Bluff Training',
      icon: '♥',
      gradient: 'from-poker-red via-poker-purple to-poker-red',
      glowColor: 'rgba(255, 51, 102, 0.4)',
      iconColor: 'text-poker-red',
      delay: 'delay-600',
    },
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden background-animated transition-opacity duration-300 ${exiting ? 'opacity-0 blur-md' : ''}`}>
      {/* 背景装饰层 */}
      <div className="absolute inset-0 hex-grid pointer-events-none" />
      
      {/* 背景光斑 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-poker-green rounded-full blur-3xl opacity-10 animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-poker-gold rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '2s' }} />
      
      {/* 主容器 */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between py-12 px-6">
        
        {/* 顶部区域 - 品牌与氛围 */}
        <div className={`w-full flex flex-col items-center space-y-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <h1 className="text-7xl md:text-8xl font-display font-black tracking-wider text-gradient-green glow-green animate-fade-in">
            GTO LEARNER
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-light tracking-widest uppercase animate-slide-up">
            Train your equilibrium — one decision at a time.
          </p>
        </div>

        {/* 中心区域 - 三个训练模式按钮 */}
        <div className={`flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 my-auto transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {modeButtons.map((mode, index) => (
            <button
              key={mode.id}
              onClick={() => handleModeClick(mode.id)}
              className={`group relative glass-strong rounded-2xl p-8 md:p-10 w-64 md:w-72 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${mode.delay} ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                transitionDelay: `${index * 100 + 200}ms`,
                boxShadow: isLoaded ? `0 0 30px ${mode.glowColor}` : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 50px ${mode.glowColor}, 0 0 80px ${mode.glowColor}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 30px ${mode.glowColor}`;
              }}
            >
              {/* 按钮内部渐变背景 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`} />
              
              {/* 按钮内容 */}
              <div className="relative z-10 flex flex-col items-center space-y-4">
                {/* 图标 */}
                <div className={`text-6xl md:text-7xl ${mode.iconColor} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                  {mode.icon}
                </div>
                
                {/* 模式名称 */}
                <h2 
                  className="text-2xl md:text-3xl font-bold font-display transition-all duration-500"
                  style={{
                    background: mode.id === 'synthesis' 
                      ? 'linear-gradient(135deg, #00e5ff 0%, #00ff88 100%)'
                      : mode.id === 'value'
                      ? 'linear-gradient(135deg, #ffd700 0%, #ff8c42 100%)'
                      : 'linear-gradient(135deg, #ff3366 0%, #9d4edd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  {mode.name}
                </h2>
                
                {/* 描述 */}
                <p className="text-xs md:text-sm text-gray-400 uppercase tracking-wider">
                  {mode.description}
                </p>
                
                {/* 装饰线条 */}
                <div className={`w-16 h-0.5 bg-gradient-to-r ${mode.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              </div>
              
              {/* 悬浮时的外圈光效 */}
              <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-opacity-50 transition-all duration-500`}
                   style={{ 
                     borderImage: `linear-gradient(135deg, ${mode.glowColor}, transparent) 1`,
                     filter: 'blur(1px)',
                   }}
              />
            </button>
          ))}
        </div>

        {/* 底部区域 - 氛围与辅助信息 */}
        <div className={`w-full flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 space-y-2 md:space-y-0 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '800ms' }}>
          {/* 左侧版本号 */}
          <div className="flex items-center space-x-2">
            <span className="uppercase tracking-wider">v1.0 Beta</span>
          </div>

          {/* 分割线 */}
          <div className="hidden md:block w-px h-6 bg-gray-600 opacity-30" />

          {/* 右侧链接 */}
          <div className="flex items-center space-x-6">
            <a 
              href="https://github.com/SunstanYu/GTOLearner.git" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-poker-green transition-colors duration-300 uppercase tracking-wider"
            >
              GitHub
            </a>
            <a 
              href="#" 
              className="hover:text-poker-green transition-colors duration-300 uppercase tracking-wider"
            >
              Settings
            </a>
            <a 
              href="#" 
              className="hover:text-poker-green transition-colors duration-300 uppercase tracking-wider"
            >
              Feedback
            </a>
          </div>
        </div>
      </div>

      {/* 背景装饰元素 - 扑克筹码 */}
      <div className="absolute top-20 right-20 w-16 h-16 glass rounded-full flex items-center justify-center text-2xl text-poker-green opacity-20 animate-float pointer-events-none">
        <span className="text-3xl">♠</span>
      </div>
      <div className="absolute bottom-32 left-32 w-12 h-12 glass rounded-full flex items-center justify-center text-xl text-poker-gold opacity-20 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>
        <span className="text-2xl">♣</span>
      </div>
      <div className="absolute top-1/3 right-1/3 w-10 h-10 glass rounded-full flex items-center justify-center text-lg text-poker-red opacity-20 animate-float pointer-events-none" style={{ animationDelay: '2s' }}>
        <span className="text-xl">♥</span>
      </div>
    </div>
  );
}