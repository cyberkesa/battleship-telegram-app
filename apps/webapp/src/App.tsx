import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTelegram } from './hooks/useTelegram';
import { UserProfile } from './components/UserProfile';

// Simple enum for cell states
enum CellState {
  EMPTY = 'empty',
  SHIP = 'ship',
  HIT = 'hit',
  MISS = 'miss',
  SUNK = 'sunk'
}

// Simple position interface
interface Position {
  x: number;
  y: number;
}

// Simple board interface
interface Board {
  ships: any[];
  shots: Position[];
  hits: Position[];
  misses: Position[];
}

// Simple cell component
const Cell: React.FC<{
  state: CellState;
  onClick?: () => void;
  showShip?: boolean;
}> = ({ state, onClick, showShip = false }) => {
  const getCellContent = () => {
    switch (state) {
      case CellState.HIT:
        return '💥';
      case CellState.MISS:
        return '💧';
      case CellState.SHIP:
        return showShip ? '🚢' : '';
      case CellState.SUNK:
        return '💀';
      default:
        return '';
    }
  };

  const getCellClasses = () => {
    const baseClasses = 'w-8 h-8 border border-gray-300 flex items-center justify-center font-bold transition-all cursor-pointer';
    
    switch (state) {
      case CellState.HIT:
        return `${baseClasses} bg-red-500 text-white`;
      case CellState.MISS:
        return `${baseClasses} bg-blue-200 text-blue-800`;
      case CellState.SHIP:
        return `${baseClasses} ${showShip ? 'bg-gray-600 text-white' : 'bg-gray-100'}`;
      case CellState.SUNK:
        return `${baseClasses} bg-red-700 text-white`;
      default:
        return `${baseClasses} bg-white hover:bg-gray-50`;
    }
  };

  return (
    <div
      className={getCellClasses()}
      onClick={onClick}
    >
      {getCellContent()}
    </div>
  );
};

// Simple game board component
const GameBoard: React.FC<{
  board: Board;
  onCellClick?: (x: number, y: number) => void;
  showShips?: boolean;
}> = ({ board, onCellClick, showShips = false }) => {
  const getCellState = (x: number, y: number): CellState => {
    const wasShot = board.shots.some(shot => shot.x === x && shot.y === y);

    if (!wasShot) {
      const hasShip = board.ships.some(ship =>
        ship.positions.some((pos: Position) => pos.x === x && pos.y === y)
      );
      return hasShip ? CellState.SHIP : CellState.EMPTY;
    }

    const ship = board.ships.find(ship =>
      ship.positions.some((pos: Position) => pos.x === x && pos.y === y)
    );

    if (ship) {
      const isSunk = ship.positions.every((pos: Position) =>
        board.hits.some(hit => hit.x === pos.x && hit.y === pos.y)
      );
      return isSunk ? CellState.SUNK : CellState.HIT;
    }

    return CellState.MISS;
  };

  return (
    <div className="grid grid-cols-10 gap-1 p-4 bg-gray-100 rounded-lg">
      {/* Column labels */}
      <div className="col-span-10 grid grid-cols-10 gap-1 mb-2">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((letter) => (
          <div key={letter} className="text-center text-xs font-bold text-gray-600">
            {letter}
          </div>
        ))}
      </div>

      {/* Game board */}
      {Array.from({ length: 10 }, (_, y) => (
        <React.Fragment key={y}>
          {/* Row label */}
          <div className="text-center text-xs font-bold text-gray-600 flex items-center justify-center">
            {y + 1}
          </div>
          
          {/* Row cells */}
          {Array.from({ length: 10 }, (_, x) => (
            <Cell
              key={`${x}-${y}`}
              state={getCellState(x, y)}
              onClick={() => onCellClick?.(x, y)}
              showShip={showShips}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

function App() {
  const { user, isLoading, isAuthenticated, error, logout } = useAuth();
  const { showMainButton, hideMainButton } = useTelegram();
  const [currentScreen, setCurrentScreen] = useState<'home' | 'game' | 'profile'>('home');
  const [gameBoard, setGameBoard] = useState<Board>({
    ships: [],
    shots: [],
    hits: [],
    misses: []
  });

  // Настройка кнопок Telegram
  useEffect(() => {
    if (currentScreen === 'home') {
      showMainButton('🎮 Начать игру', () => setCurrentScreen('game'));
    } else if (currentScreen === 'game') {
      hideMainButton();
    } else if (currentScreen === 'profile') {
      hideMainButton();
    }
  }, [currentScreen, showMainButton, hideMainButton]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">🚢 Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка аутентификации</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">🚢 Морской бой</h1>
          <p className="text-gray-600 mb-8">Ожидание аутентификации через Telegram...</p>
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <button
              onClick={() => setCurrentScreen('home')}
              className="bg-white text-blue-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← Назад
            </button>
          </div>
          <UserProfile user={user!} onLogout={logout} />
        </div>
      </div>
    );
  }

  if (currentScreen === 'game') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">🚢 Морской бой</h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentScreen('profile')}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  👤 Профиль
                </button>
                <button
                  onClick={() => setCurrentScreen('home')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ← Назад
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Player's board */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Ваше поле</h2>
                <GameBoard
                  board={gameBoard}
                  showShips={true}
                  onCellClick={(x, y) => {
                    console.log('Player clicked:', x, y);
                  }}
                />
              </div>

              {/* Opponent's board */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Поле противника</h2>
                <GameBoard
                  board={gameBoard}
                  showShips={false}
                  onCellClick={(x, y) => {
                    console.log('Opponent clicked:', x, y);
                    // Add shot to board
                    setGameBoard(prev => ({
                      ...prev,
                      shots: [...prev.shots, { x, y }]
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user?.firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🚢 Морской бой</h1>
            <p className="text-gray-600">Привет, {user?.firstName}!</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Ваша статистика:</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-bold text-blue-600">{user?.gamesPlayed}</div>
                <div className="text-blue-700">Игр</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">{user?.gamesWon}</div>
                <div className="text-green-700">Побед</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">{user?.rating}</div>
                <div className="text-purple-700">Рейтинг</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🎮 Как играть:</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Разместите корабли на поле</li>
              <li>• Стреляйте по полю противника</li>
              <li>• Первый, кто потопит все корабли, побеждает!</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => setCurrentScreen('profile')}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            👤 Мой профиль
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Версия 1.0.0 • Аутентификация через Telegram
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
