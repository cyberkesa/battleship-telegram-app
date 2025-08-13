import React from 'react';
import { LoadingSpinner } from '@battleship/ui';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-tg-bg">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <h2 className="text-xl font-semibold text-tg-text mb-2">
          Загрузка игры...
        </h2>
        <p className="text-tg-hint">
          Подготовка к морскому сражению
        </p>
      </div>
    </div>
  );
};
