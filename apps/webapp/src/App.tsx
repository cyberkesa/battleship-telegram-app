import React, { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTelegram } from './hooks/useTelegram';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';
import { MatchmakingScreen } from './screens/MatchmakingScreen';
import { SetupScreen } from './screens/SetupScreen';
import { Toast, ToastType } from './components/ui/Toast';

type Screen = 'lobby' | 'matchmaking' | 'setup' | 'game' | 'history' | 'settings' | 'inventory';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

function App() {
  const { user, isLoading, isAuthenticated, error } = useAuth();
  const { showMainButton, hideMainButton } = useTelegram();
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Demo game data
  const [gameBoard, setGameBoard] = useState({
    ships: [
      {
        id: '1',
        positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }], // Aircraft carrier
        hits: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
        isSunk: false
      },
      {
        id: '2',
        positions: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }], // Battleship
        hits: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }],
        isSunk: true
      },
      {
        id: '3',
        positions: [{ x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }], // Cruiser
        hits: [],
        isSunk: false
      }
    ],
    shots: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
      { x: 5, y: 5 }, { x: 6, y: 6 }, { x: 8, y: 8 }
    ],
    hits: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }
    ],
    misses: [
      { x: 5, y: 5 }, { x: 6, y: 6 }, { x: 8, y: 8 }
    ]
  });

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleStartGame = () => {
    setCurrentScreen('matchmaking');
    addToast('info', 'Поиск соперника', 'Ищем подходящего игрока...');
  };

  const handleShowHistory = () => {
    setCurrentScreen('history');
    addToast('info', 'История игр', 'Загружаем ваши матчи...');
  };

  const handleShowSettings = () => {
    setCurrentScreen('settings');
    addToast('info', 'Настройки', 'Открываем настройки...');
  };

  const handleShowInventory = () => {
    setCurrentScreen('inventory');
    addToast('info', 'Инвентарь', 'Загружаем ваши предметы...');
  };

  const handleBackToLobby = () => {
    setCurrentScreen('lobby');
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-steel-depth flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sonar/30 border-t-sonar rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-foam font-sans font-semibold text-lg mb-2">Инициализация</h2>
          <p className="text-mist text-sm">Подключение к серверу...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-steel-depth flex items-center justify-center p-4">
        <div className="bg-graphite ring-1 ring-edge rounded-xl p-6 max-w-md w-full text-center">
          <h1 className="text-torpedo font-sans font-semibold text-xl mb-4">Ошибка подключения</h1>
          <p className="text-mist mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-sonar text-deep px-6 py-3 rounded-lg font-sans font-medium hover:bg-sonar/90 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-steel-depth flex items-center justify-center p-4">
        <div className="bg-graphite ring-1 ring-edge rounded-xl p-6 max-w-md w-full text-center">
          <h1 className="text-foam font-sans font-semibold text-2xl mb-6">🚢 Морской бой</h1>
          <p className="text-mist mb-8">Ожидание аутентификации через Telegram...</p>
          <div className="w-8 h-8 border-4 border-sonar/30 border-t-sonar rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'lobby':
        return (
          <LobbyScreen
            onStartGame={handleStartGame}
            onShowHistory={handleShowHistory}
            onShowSettings={handleShowSettings}
            onShowInventory={handleShowInventory}
          />
        );
      
      case 'matchmaking':
        return (
          <MatchmakingScreen
            onMatchFound={() => setCurrentScreen('setup')}
            onCancel={() => setCurrentScreen('lobby')}
          />
        );
      
      case 'setup':
        return (
          <SetupScreen
            onReady={() => setCurrentScreen('game')}
            onBack={() => setCurrentScreen('lobby')}
          />
        );
      
      case 'game':
        return (
          <GameScreen
            gameBoard={gameBoard}
            onBack={() => setCurrentScreen('lobby')}
          />
        );
      
      case 'history':
      case 'settings':
      case 'inventory':
        return (
          <div className="min-h-screen bg-steel-depth flex items-center justify-center p-4">
            <div className="bg-graphite ring-1 ring-edge rounded-xl p-6 max-w-md w-full text-center">
              <h1 className="text-foam font-sans font-semibold text-xl mb-4">
                {currentScreen === 'history' && 'История игр'}
                {currentScreen === 'settings' && 'Настройки'}
                {currentScreen === 'inventory' && 'Инвентарь'}
              </h1>
              <p className="text-mist mb-6">Эта функция находится в разработке</p>
              <button
                onClick={handleBackToLobby}
                className="bg-sonar text-deep px-6 py-3 rounded-lg font-sans font-medium hover:bg-sonar/90 transition-colors"
              >
                Назад в лобби
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="App">
      {renderScreen()}
      
      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default App;
