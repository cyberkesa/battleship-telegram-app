import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, LoadingScreen } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';

interface LobbyPlayer {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  isReady: boolean;
  isHost: boolean;
}

interface Lobby {
  id: string;
  host: LobbyPlayer;
  players: LobbyPlayer[];
  status: 'waiting' | 'ready' | 'starting';
  createdAt: string;
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

  // Загружаем лобби из localStorage
  useEffect(() => {
    if (!lobbyId) {
      setError('ID лобби не найден');
      setIsLoading(false);
      return;
    }

    try {
      const lobbyData = localStorage.getItem(`lobby_${lobbyId}`);
      if (lobbyData) {
        const lobbyObj = JSON.parse(lobbyData);
        setLobby(lobbyObj);
        
        // Проверяем, готов ли текущий пользователь
        const currentPlayer = lobbyObj.players.find((p: LobbyPlayer) => p.id === user?.id);
        setIsReady(currentPlayer?.isReady || false);
      } else {
        setError('Лобби не найдено');
      }
    } catch (err) {
      setError('Ошибка загрузки лобби');
    } finally {
      setIsLoading(false);
    }
  }, [lobbyId, user?.id]);

  const handleToggleReady = () => {
    if (!lobby || !user) return;

    const newIsReady = !isReady;
    setIsReady(newIsReady);

    // Обновляем лобби в localStorage
    const updatedLobby: Lobby = {
      ...lobby,
      players: lobby.players.map(player => 
        player.id === user.id 
          ? { ...player, isReady: newIsReady }
          : player
      ),
      status: newIsReady && lobby.players.length === 2 ? 'ready' : 'waiting'
    };

    setLobby(updatedLobby);
    localStorage.setItem(`lobby_${lobbyId}`, JSON.stringify(updatedLobby));
  };

  const handleStartGame = async () => {
    if (!lobby || !user) return;

    try {
      setIsStarting(true);
      
      // Создаем матч
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Сохраняем матч в localStorage
      const match = {
        id: matchId,
        lobbyId: lobby.id,
        players: lobby.players,
        status: 'setup',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`match_${matchId}`, JSON.stringify(match));
      
      // Обновляем статус лобби
      const updatedLobby: Lobby = { ...lobby, status: 'starting' };
      setLobby(updatedLobby);
      localStorage.setItem(`lobby_${lobbyId}`, JSON.stringify(updatedLobby));
      
      // Переходим к настройке игры
      navigate(`/setup/${matchId}`);
    } catch (err) {
      console.error('Ошибка запуска игры:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!lobbyId) return;
    
    const inviteLink = `${window.location.origin}/lobby/${lobbyId}`;
    navigator.clipboard.writeText(inviteLink);
    
    // Можно добавить toast уведомление
    alert('Ссылка скопирована в буфер обмена!');
  };

  const handleLeaveLobby = () => {
    if (lobbyId) {
      localStorage.removeItem(`lobby_${lobbyId}`);
    }
    navigate('/');
  };

  if (isLoading) {
    return <LoadingScreen status="connecting" message="Загрузка лобби..." />;
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen bg-bg-deep text-foam flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="font-heading font-semibold text-h2 text-foam mb-2">
            Ошибка
          </h2>
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

  const isHost = lobby.host.id === user?.id;
  const allPlayersReady = lobby.players.length === 2 && lobby.players.every(p => p.isReady);
  const canStartGame = isHost && allPlayersReady;

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-semibold text-h2 text-foam">
              Лобби игры
            </h1>
            <p className="text-secondary text-mist">
              ID: {lobby.id.slice(-8)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveLobby}
          >
            Покинуть
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-h3 text-foam">
                Статус: {lobby.status === 'waiting' ? 'Ожидание игроков' : 'Готово к игре'}
              </h3>
              <p className="text-secondary text-mist">
                {lobby.players.length}/2 игроков
              </p>
            </div>
            <div className="text-right">
              <p className="text-caption text-mist">Создано</p>
              <p className="text-body text-foam">
                {new Date(lobby.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam">
            Игроки
          </h3>
          
          {lobby.players.map((player, index) => (
            <div
              key={player.id}
              className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-deep rounded-full ring-2 ring-sonar flex items-center justify-center">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt="Avatar" className="w-full h-full rounded-full" />
                    ) : (
                      <span className="font-heading font-semibold text-sonar">
                        {player.firstName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-body text-foam">
                      {player.firstName} {player.lastName}
                    </h4>
                    <p className="text-caption text-mist">
                      {player.isHost ? 'Хост' : 'Игрок'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {player.isReady && (
                    <span className="text-success text-sm">✓ Готов</span>
                  )}
                  {player.isHost && (
                    <span className="text-info text-sm">👑</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty slot */}
          {lobby.players.length < 2 && (
            <div className="bg-bg-graphite/50 rounded-card ring-1 ring-edge/50 border-dashed p-4">
              <div className="text-center">
                <p className="text-body text-mist">Ожидание второго игрока...</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* Invite link */}
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCopyInviteLink}
            className="w-full"
          >
            📋 Скопировать ссылку приглашения
          </Button>

          {/* Ready toggle */}
          <Button
            variant={isReady ? "primary" : "primary"}
            size="lg"
            onClick={handleToggleReady}
            className="w-full"
          >
            {isReady ? '✓ Готов к игре' : 'Готов к игре'}
          </Button>

          {/* Start game */}
          {canStartGame && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartGame}
              loading={isStarting}
              disabled={isStarting}
              className="w-full"
            >
              {isStarting ? 'Запуск игры...' : '🚀 Начать игру'}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};
