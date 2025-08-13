import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { QuickGameSetupScreen } from './screens/QuickGameSetupScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';
import { MatchmakingScreen } from './screens/MatchmakingScreen';
import { AuthProvider } from './providers/AuthProvider';
import { TelegramProvider } from './providers/TelegramProvider';

function App() {
  return (
    <TelegramProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/lobby/:lobbyId" element={<LobbyScreen />} />
            <Route path="/setup/quick-game" element={<QuickGameSetupScreen />} />
            <Route path="/setup/:matchId" element={<SetupScreen />} />
            <Route path="/game/:matchId" element={<GameScreen />} />
            <Route path="/game/quick-game" element={<GameScreen />} />
            <Route path="/matchmaking" element={<MatchmakingScreen />} />
          </Routes>
        </Router>
      </AuthProvider>
    </TelegramProvider>
  );
}

export default App;
