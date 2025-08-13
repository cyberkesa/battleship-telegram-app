import React from 'react';
import { motion } from 'framer-motion';

interface RingTimerProps {
  timeLeft: number; // seconds
  totalTime: number; // seconds
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const RingTimer: React.FC<RingTimerProps> = ({
  timeLeft,
  totalTime,
  size = 40,
  strokeWidth = 3,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = timeLeft / totalTime;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  // Color based on time remaining
  const getStrokeColor = () => {
    if (progress > 0.5) return '#00E08C'; // sonar
    if (progress > 0.2) return '#FFC857'; // amber
    return '#FF3B3B'; // torpedo
  };

  const strokeColor = getStrokeColor();

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#273140"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </svg>
      
      {/* Time text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-mono font-medium text-foam">
          {Math.ceil(timeLeft)}
        </span>
      </div>
      
      {/* Warning pulse animation */}
      {progress <= 0.2 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${strokeColor}` }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.div>
  );
};
