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
import { SystemStatus } from './components/SystemStatus';

function DeepLinkHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    const search = new URLSearchParams(location.search);
    const startParam: string = tg?.initDataUnsafe?.start_param ?? search.get('tgWebAppStartParam') ?? '';

    // base64url helpers
    const fromB64Url = (s: string) => {
      if (!s) return s;
      let t = s.replace(/-/g, '+').replace(/_/g, '/');
      while (t.length % 4) t += '=';
      try { return atob(t); } catch { return ''; }
    };

    if (import.meta.env.DEV) {
      console.log('[DeepLink] start_param =', startParam);
    }

    if (startParam) {
      let lobbyId = '';
      if (/^join_[A-Za-z0-9_-]+$/.test(startParam)) {
        lobbyId = startParam.slice(5);
      } else {
        try {
          const decoded = fromB64Url(startParam);
          const obj = JSON.parse(decoded);
          if (obj?.t === 'join' && typeof obj.id === 'string') lobbyId = obj.id;
        } catch {}
      }
      if (lobbyId) navigate(`/lobby/${lobbyId}`, { replace: true });
    }
  }, [navigate]);
  return null;
}

function App() {
  // Overlay enabled by default; no URL toggle needed
  return (
    <TelegramProvider>
      <AuthProvider>
        <BrowserRouter>
          <DeepLinkHandler />
          {import.meta.env.VITE_DEBUG_NET === 'true' ? <NetworkDebugOverlay /> : null}
          {import.meta.env.VITE_STATUS_WIDGET !== 'false' ? <SystemStatus /> : null}
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
