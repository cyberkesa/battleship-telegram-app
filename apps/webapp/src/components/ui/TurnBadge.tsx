import React from 'react';
import { motion } from 'framer-motion';

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
    <motion.div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        ${isMyTurn 
          ? 'bg-sonar/10 ring-1 ring-sonar/30 text-sonar' 
          : 'bg-mute/10 ring-1 ring-mute/30 text-mist'
        }
        ${className}
      `}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pulse indicator */}
      <motion.div
        className={`
          w-2 h-2 rounded-full
          ${isMyTurn ? 'bg-sonar' : 'bg-mute'}
        `}
        animate={isMyTurn ? {
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
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
    </motion.div>
  );
};
