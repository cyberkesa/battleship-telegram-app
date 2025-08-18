import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { TelegramProvider } from './providers/TelegramProvider';
import { AuthProvider } from './providers/AuthProvider';
import { HomeScreen } from './screens/HomeScreen';
import { CreateLobbyScreen } from './screens/CreateLobbyScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';
import { MatchmakingScreen } from './screens/MatchmakingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { NetworkDebugOverlay } from './components/NetworkDebugOverlay';
import { setDebugNetEnabled } from './stores/debugNetworkStore';

function DeepLinkHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    const startParam: string | undefined = tg?.initDataUnsafe?.start_param;
    if (startParam) {
      if (startParam.startsWith('join:')) {
        const id = startParam.slice('join:'.length);
        if (id) {
          navigate(`/lobby/${id}`, { replace: true });
        }
      }
    }
  }, [navigate]);
  return null;
}

function App() {
  // Enable overlay via URL param ?debugNet=1 or env
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('debugNet');
    if (v === '1' || v === 'true') {
      setDebugNetEnabled(true);
    }
  }, []);
  return (
    <TelegramProvider>
      <AuthProvider>
        <BrowserRouter>
          <DeepLinkHandler />
          <NetworkDebugOverlay />
          <Routes>
            {/* Главная страница */}
            <Route path="/" element={<HomeScreen />} />
            
            {/* Создание лобби */}
            <Route path="/lobby/create" element={<CreateLobbyScreen />} />
            
            {/* Лобби */}
            <Route path="/lobby/:lobbyId" element={<LobbyScreen />} />
            
            {/* Расстановка кораблей */}
            <Route path="/setup/:matchId" element={<SetupScreen />} />
            
            {/* Игра */}
            <Route path="/game/:matchId" element={<GameScreen />} />
            <Route path="/game/quick-game" element={<GameScreen />} />
            
            {/* Поиск игры */}
            <Route path="/matchmaking" element={<MatchmakingScreen />} />
            
            {/* Профиль и настройки */}
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TelegramProvider>
  );
}

export default App;
