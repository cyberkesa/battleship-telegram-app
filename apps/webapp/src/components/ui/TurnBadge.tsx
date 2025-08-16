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
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        ${isMyTurn 
          ? 'bg-sonar/10 ring-1 ring-sonar/30 text-sonar' 
          : 'bg-mute/10 ring-1 ring-mute/30 text-mist'
        }
        ${className}
      `}
    >
      {/* Indicator */}
      <div
        className={`
          w-2 h-2 rounded-full
          ${isMyTurn ? 'bg-sonar' : 'bg-mute'}
        `}
      />
      
      {/* Text */}
      <span className="text-sm font-mono font-medium">
        {isMyTurn ? 'ВАШ ХОД' : 'ЖДЁМ...'}
      </span>
      
      {/* Timer */}
      {timeLeft !== undefined && (
        <span className="text-xs font-mono text-mist">
          {Math.ceil(timeLeft)}с
        </span>
      )}
    </div>
  );
};
