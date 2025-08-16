import React from 'react';

interface TurnBadgeProps {
  isMyTurn: boolean;
  timeLeft?: number;
  className?: string;
}

export const TurnBadge: React.FC<TurnBadgeProps> = ({
  isMyTurn,
  timeLeft,
  className = '',
}) => {
  const variants = {
    myTurn: {
      backgroundColor: 'rgba(0, 224, 140, 0.1)',
      borderColor: '#00E08C',
      scale: 1,
    },
    opponentTurn: {
      backgroundColor: 'rgba(147, 163, 179, 0.1)',
      borderColor: '#93A3B3',
      scale: 0.98,
    },
  };

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2
        font-heading font-semibold text-body
        ${className}
      `}
    >
      {/* Индикатор активности */}
      <div className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-sonar' : 'bg-mist'}`} />
      
      {/* Текст */}
      <span className={isMyTurn ? 'text-sonar' : 'text-mist'}>
        {isMyTurn ? 'ВАШ ХОД' : 'ЖДЁМ...'}
      </span>

      {/* Таймер (если есть) */}
      {timeLeft !== undefined && (
        <div className="ml-2">
          <span className="font-mono text-secondary text-mist">
            {Math.ceil(timeLeft)}с
          </span>
        </div>
      )}
    </div>
  );
};
