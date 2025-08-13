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
    <motion.div
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2
        font-heading font-semibold text-body
        ${className}
      `}
      variants={variants}
      animate={isMyTurn ? 'myTurn' : 'opponentTurn'}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Индикатор активности */}
      <motion.div
        className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-sonar' : 'bg-mist'}`}
        animate={isMyTurn ? { scale: [1, 1.2, 1] } : {}}
        transition={isMyTurn ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
      />
      
      {/* Текст */}
      <span className={isMyTurn ? 'text-sonar' : 'text-mist'}>
        {isMyTurn ? 'ВАШ ХОД' : 'ЖДЁМ...'}
      </span>

      {/* Таймер (если есть) */}
      {timeLeft !== undefined && (
        <motion.div
          className="ml-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="font-mono text-secondary text-mist">
            {Math.ceil(timeLeft)}с
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
