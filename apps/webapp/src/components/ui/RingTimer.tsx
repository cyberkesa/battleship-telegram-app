import React from 'react';

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
    if (progress > 0.5) return '#2563EB'; // sonar -> blue
    if (progress > 0.2) return '#F59E0B'; // amber
    return '#DC2626'; // torpedo red
  };

  const strokeColor = getStrokeColor();

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          style={{ transition: 'stroke-dashoffset 100ms linear', strokeDashoffset }}
        />
      </svg>
      
      {/* Time text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-mono font-medium text-foam">
          {Math.ceil(timeLeft)}
        </span>
      </div>
    </div>
  );
};
