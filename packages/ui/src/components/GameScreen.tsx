import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Board, CellState } from './Board';
import { TurnBadge } from './TurnBadge';
import { RingTimer } from './RingTimer';
import { Button } from './Button';
import { Toast, ToastType } from './Toast';
import { Modal } from './Modal';
import { MoreHorizontal, Target, RotateCcw } from 'lucide-react';

interface GameScreenProps {
  onBackToLobby: () => void;
  onSurrender: () => void;
}

// Создаем пустую сетку 10x10
const createEmptyBoard = (): CellState[][] => {
  return Array(10).fill(null).map(() => Array(10).fill('idle'));
};

export const GameScreen: React.FC<GameScreenProps> = ({
  onBackToLobby,
  onSurrender,
}) => {
  const [opponentBoard, setOpponentBoard] = useState<CellState[][]>(createEmptyBoard());
  const [myBoard, setMyBoard] = useState<CellState[][]>(createEmptyBoard());
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [toast, setToast] = useState<{ type: ToastType; title: string; message?: string } | null>(null);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn) return;

    // Симуляция выстрела
    const newBoard = [...opponentBoard];
    const randomHit = Math.random() > 0.7; // 30% шанс попадания
    
    if (randomHit) {
      newBoard[row][col] = 'hit';
      setToast({ type: 'success', title: 'Попадание!', message: 'Корабль повреждён' });
    } else {
      newBoard[row][col] = 'miss';
      setToast({ type: 'info', title: 'Промах', message: 'Попробуйте ещё раз' });
    }
    
    setOpponentBoard(newBoard);
    setIsMyTurn(false);
    
    // Симуляция хода противника через 2 секунды
    setTimeout(() => {
      const newMyBoard = [...myBoard];
      const randomRow = Math.floor(Math.random() * 10);
      const randomCol = Math.floor(Math.random() * 10);
      const randomHit = Math.random() > 0.7;
      
      if (randomHit) {
        newMyBoard[randomRow][randomCol] = 'ship-hit';
        setToast({ type: 'error', title: 'Попадание по вам!', message: 'Корабль повреждён' });
      } else {
        newMyBoard[randomRow][randomCol] = 'miss';
      }
      
      setMyBoard(newMyBoard);
      setIsMyTurn(true);
      setTimeLeft(60);
    }, 2000);
  };

  const handleSurrender = () => {
    setShowSurrenderModal(true);
  };

  const confirmSurrender = () => {
    setShowSurrenderModal(false);
    onSurrender();
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam selection-sonar">
      {/* Верхняя HUD-панель */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Противник */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bg-graphite rounded-full ring-1 ring-edge flex items-center justify-center">
              <span className="font-heading font-semibold text-mist text-caption">E</span>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-body text-foam">
                Противник
              </h3>
              <p className="font-mono text-caption text-mist">
                Онлайн
              </p>
            </div>
          </div>

          {/* Индикатор хода */}
          <div className="flex items-center gap-3">
            <TurnBadge isMyTurn={isMyTurn} timeLeft={timeLeft} />
            <RingTimer duration={60} currentTime={timeLeft} size="sm" />
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="p-4 space-y-4">
        {/* Поле противника */}
        <div>
          <h3 className="font-heading font-semibold text-h3 text-foam mb-3">
            Поле противника
          </h3>
          <Board
            cells={opponentBoard}
            onCellClick={handleCellClick}
            disabled={!isMyTurn}
            isOpponent={true}
            className="mx-auto"
          />
        </div>

        {/* Разделитель */}
        <div className="h-px bg-edge/50" />

        {/* Ваше поле */}
        <div>
          <h3 className="font-heading font-semibold text-h3 text-foam mb-3">
            Ваше поле
          </h3>
          <Board
            cells={myBoard}
            size="mini"
            showCoordinates={false}
            className="mx-auto"
          />
        </div>

        {/* Панель действий */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-2 bg-bg-graphite rounded-lg ring-1 ring-edge">
              <Target className="w-4 h-4 text-sonar" strokeWidth={2} />
              <span className="font-mono text-caption text-mist">
                {opponentBoard.flat().filter(cell => cell === 'hit').length} попаданий
              </span>
            </div>
            <div className="flex items-center gap-1 px-3 py-2 bg-bg-graphite rounded-lg ring-1 ring-edge">
              <RotateCcw className="w-4 h-4 text-mist" strokeWidth={2} />
              <span className="font-mono text-caption text-mist">
                {opponentBoard.flat().filter(cell => cell === 'miss').length} промахов
              </span>
            </div>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleSurrender}
            icon={<MoreHorizontal className="w-4 h-4" strokeWidth={2} />}
          >
            Сдаться
          </Button>
        </div>
      </div>

      {/* Toast уведомления */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Модалка подтверждения сдачи */}
      <Modal
        isOpen={showSurrenderModal}
        onClose={() => setShowSurrenderModal(false)}
        title="Подтверждение сдачи"
        actions={{
          primary: {
            label: 'Сдаться',
            onClick: confirmSurrender,
            variant: 'danger'
          },
          secondary: {
            label: 'Отмена',
            onClick: () => setShowSurrenderModal(false)
          }
        }}
      >
        Вы уверены, что хотите сдаться? Это действие нельзя отменить.
      </Modal>
    </div>
  );
};
