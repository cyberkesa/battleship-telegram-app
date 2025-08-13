import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  status?: 'connecting' | 'restoring' | 'failed';
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  status = 'connecting',
  message,
  onRetry,
  className = '',
}) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'connecting':
        return message || 'Идёт инициализация...';
      case 'restoring':
        return message || 'Восстанавливаем сессию...';
      case 'failed':
        return message || 'Ошибка подключения';
      default:
        return message || 'Загрузка...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'failed':
        return 'text-torpedo';
      case 'restoring':
        return 'text-radio';
      default:
        return 'text-sonar';
    }
  };

  return (
    <div className={`min-h-screen bg-bg-deep flex items-center justify-center ${className}`}>
      <div className="text-center">
        {/* Логотип с анимацией сонара */}
        <div className="relative mb-8">
          <motion.div
            className="w-16 h-16 mx-auto bg-bg-graphite rounded-full ring-2 ring-sonar flex items-center justify-center"
            animate={status === 'failed' ? {} : { scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="w-8 h-8 bg-sonar rounded-full"
              animate={status === 'failed' ? {} : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Кольца сонара */}
          {status !== 'failed' && (
            <>
              <motion.div
                className="absolute inset-0 border-2 border-sonar/30 rounded-full"
                animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 border-2 border-sonar/20 rounded-full"
                animate={{ scale: [1, 3, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
            </>
          )}
        </div>

        {/* Статус */}
        <motion.h2
          className={`font-heading font-semibold text-h2 ${getStatusColor()} mb-2`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {status === 'failed' ? 'ОШИБКА' : 'МОРСКОЙ БОЙ'}
        </motion.h2>

        <motion.p
          className="text-body text-mist mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {getStatusMessage()}
        </motion.p>

        {/* Кнопка повтора */}
        {status === 'failed' && onRetry && (
          <motion.button
            className="px-6 py-3 bg-torpedo text-black font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity"
            onClick={onRetry}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Повторить
          </motion.button>
        )}

        {/* Индикатор загрузки */}
        {status !== 'failed' && (
          <motion.div
            className="flex justify-center gap-1 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-sonar rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};
