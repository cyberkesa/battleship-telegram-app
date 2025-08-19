import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, LoadingScreen } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { 
  Copy, 
  LogOut, 
  Play, 
  CheckCircle, 
  Clock, 
  Crown,
  User,
  AlertCircle
} from 'lucide-react';
import { lobbyAPI } from '../services/api';

interface LobbyPlayer {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
  isHost: boolean;
}

interface Lobby {
  id: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'starting';
  players: LobbyPlayer[];
  createdAt: string;
  inviteLink: string;
  matchId?: string;
}

export const LobbyScreen: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const buildLobbyDeepLink = (id: string) => {
    const raw = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
    const botUsername = raw?.startsWith('@') ? raw.slice(1) : raw;
    if (botUsername) {
      const payload = `join:${id}`;
      return `https://t.me/${botUsername}?startapp=${encodeURIComponent(payload)}`;
    }
    return `${window.location.origin}/lobby/${id}`;
  };

  // Load lobby from backend
  useEffect(() => {
    const load = async () => {
      if (!lobbyId) {
        setError('ID лобби не найден');
        setIsLoading(false);
        return;
      }
      try {
        const res = await lobbyAPI.status(lobbyId);
        const data = res.data as Lobby;
        setLobby({
          ...data,
          createdAt: (data as any).createdAt || new Date().toISOString(),
        });
        if (user) {
          const current = data.players.find(p => p.id === user.id);
          setIsReady(!!current?.isReady);
          // Auto-join if not in lobby and lobby is waiting
          if (!current && data.status === 'waiting' && data.players.length < 2) {
            try {
              await lobbyAPI.join(lobbyId, user.firstName || 'Игрок', user.photoUrl);
              const refreshed = await lobbyAPI.status(lobbyId);
              const newData = refreshed.data as Lobby;
              setLobby(newData as any);
              const me = newData.players.find(p => p.id === user.id);
              setIsReady(!!me?.isReady);
            } catch (e) {
              // ignore join errors
            }
          }
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Ошибка загрузки лобби');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [lobbyId, user?.id]);

  const handleToggleReady = async () => {
    if (!lobby || !user || !lobbyId) return;

    try {
      await lobbyAPI.ready(lobbyId);
      // Refresh
      const res = await lobbyAPI.status(lobbyId);
      const data = res.data as Lobby;
      setLobby(data);
      const current = data.players.find(p => p.id === user.id);
      setIsReady(!!current?.isReady);
      if (data.matchId) {
        setIsStarting(true);
        navigate(`/setup/${data.matchId}`);
      }
    } catch (e: any) {
      if (import.meta.env.DEV) {
        console.error('[Lobby] ready failed', {
          status: e?.response?.status,
          response: e?.response?.data,
          headers: e?.response?.headers,
          message: e?.message
        });
      }
    }
  };

  const handleStartGame = async () => {
    // Starting is handled by backend when both ready
    if (lobby?.matchId) {
      navigate(`/setup/${lobby.matchId}`);
    }
  };

  const handleCopyInviteLink = () => {
    if (!lobbyId) return;
    const inviteLink = lobby?.inviteLink || buildLobbyDeepLink(lobbyId);
    navigator.clipboard.writeText(inviteLink);
    alert('Ссылка скопирована в буфер обмена!');
  };

  const handleLeaveLobby = async () => {
    if (!lobbyId) return;
    try {
      await lobbyAPI.leave(lobbyId);
    } catch {}
    navigate('/');
  };

  if (isLoading) {
    return <LoadingScreen status="connecting" message="Загрузка лобби..." />;
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen bg-bg-deep text-foam flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-torpedo mb-2">
            <AlertCircle className="w-6 h-6" />
            <h2 className="font-heading font-semibold text-h2 text-foam">
              Ошибка
            </h2>
          </div>
          <p className="text-body text-mist mb-4">{error || 'Лобби не найдено'}</p>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
          >
            Вернуться домой
          </Button>
        </div>
      </div>
    );
  }

  const isHost = lobby.players.find(p => p.id === user?.id)?.isHost || false;
  const allPlayersReady = lobby.players.length === 2 && lobby.players.every(p => p.isReady);
  const canStartGame = isHost && allPlayersReady;

  return (
    <div className="min-h-screen bg-bg-deep text-foam" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-semibold text-h2 text-foam truncate">
              Лобби игры
            </h1>
            <p className="text-secondary text-mist truncate">
              ID: {lobby.id.slice(-8)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveLobby}
            className="flex items-center gap-2 flex-shrink-0 ml-4"
          >
            <LogOut className="w-4 h-4" />
            Покинуть
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 sm:space-y-6">
        {/* Status */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-h3 text-foam truncate">
                Статус: {lobby.status === 'waiting' ? 'Ожидание игроков' : lobby.status === 'playing' ? 'Игра' : 'Готово к игре'}
              </h3>
              <p className="text-secondary text-mist truncate">
                {lobby.players.length}/2 игроков
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <p className="text-caption text-mist">Создано</p>
              <p className="text-body text-foam">
                {new Date(lobby.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-h3 text-foam">
            Игроки
          </h3>
          
          {lobby.players.map((player) => (
            <div
              key={player.id}
              className="bg-bg-graphite rounded-card ring-1 ring-edge p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-bg-deep rounded-full ring-2 ring-sonar flex items-center justify-center flex-shrink-0">
                    {player.avatar ? (
                      <img src={player.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                    ) : (
                      <User className="w-5 h-5 text-sonar" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-semibold text-body text-foam truncate">
                      {player.name}
                    </h4>
                    <p className="text-caption text-mist truncate">
                      {player.isHost ? 'Хост' : 'Игрок'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {player.isReady && (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Готов</span>
                    </div>
                  )}
                  {player.isHost && (
                    <div className="flex items-center gap-1 text-info">
                      <Crown className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty slot */}
          {lobby.players.length < 2 && (
            <div className="bg-bg-graphite/50 rounded-card ring-1 ring-edge/50 border-dashed p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-mist mb-2">
                  <Clock className="w-5 h-5" />
                  <p className="text-body">Ожидание второго игрока...</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          {/* Invite link */}
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCopyInviteLink}
            className="w-full flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Скопировать ссылку приглашения
          </Button>

          {/* Ready toggle */}
          <Button
            variant={isReady ? 'primary' : 'primary'}
            size="lg"
            onClick={handleToggleReady}
            className="w-full flex items-center justify-center gap-2"
          >
            {isReady ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Готов к игре
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Готов к игре
              </>
            )}
          </Button>

          {/* Start game */}
          {canStartGame && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartGame}
              loading={isStarting}
              disabled={isStarting}
              className="w-full flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <Clock className="w-4 h-4" />
                  Запуск игры...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Начать игру
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
