import React from 'react';

interface RingTimerProps {
  duration: number; // в секундах
  currentTime: number; // в секундах
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { size: 32, stroke: 2, fontSize: 'text-caption' },
  md: { size: 40, stroke: 3, fontSize: 'text-secondary' },
  lg: { size: 48, stroke: 4, fontSize: 'text-body' },
};

export const RingTimer: React.FC<RingTimerProps> = ({
  duration,
  currentTime,
  size = 'md',
  showText = true,
  className = '',
}) => {
  const config = sizeConfig[size];
  const radius = (config.size - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, currentTime / duration));
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  // Цвет в зависимости от оставшегося времени
  const getStrokeColor = () => {
    const remainingPercent = (currentTime / duration) * 100;
    if (remainingPercent > 50) return '#FFC857'; // radio
    if (remainingPercent > 20) return '#FFA500'; // оранжевый
    return '#FF3B3B'; // torpedo
  };

  const strokeColor = getStrokeColor();

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={config.size}
        height={config.size}
        className="-rotate-90"
      >
        {/* Фоновый круг */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={config.stroke}
          fill="transparent"
          opacity={1}
        />
        
        {/* Прогресс */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={config.stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          style={{ transition: 'stroke-dashoffset 100ms linear', strokeDashoffset }}
        />
      </svg>

      {/* Текст в центре */}
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-semibold text-foam ${config.fontSize}`}>
            {Math.ceil(currentTime)}
          </span>
        </div>
      )}

      {/* Без пульсации для строгого UI */}
    </div>
  );
};
