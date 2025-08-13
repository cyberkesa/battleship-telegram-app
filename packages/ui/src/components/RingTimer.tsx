import React from 'react';
import { motion } from 'framer-motion';

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
        className="transform -rotate-90"
      >
        {/* Фоновый круг */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke="#273140"
          strokeWidth={config.stroke}
          fill="transparent"
          opacity={0.3}
        />
        
        {/* Прогресс */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={config.stroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.1, ease: "linear" }}
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

      {/* Пульсация при критическом времени */}
      {currentTime <= 10 && currentTime > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full ring-2 ring-torpedo/30"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  );
};
