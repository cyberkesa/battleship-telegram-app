import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, LoadingScreen } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { api } from '../services/api';

interface LobbyPlayer {
  id: string;
  name: string;
  avatar?: string;
  isReady: boolean;
  isHost: boolean;
}

interface Lobby {
  id: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  players: LobbyPlayer[];
  inviteLink: string;
  createdAt: Date;
  matchId?: string;
}

export const LobbyScreen: React.FC = () => {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isSettingReady, setIsSettingReady] = useState(false);

  useEffect(() => {
    if (lobbyId) {
      loadLobby();
    }
  }, [lobbyId]);

  useEffect(() => {
    if (lobby?.status === 'playing' && lobby.matchId) {
      navigate(`/game/${lobby.matchId}`);
    }
  }, [lobby, navigate]);

  const loadLobby = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/lobby/${lobbyId}`);
      setLobby(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки лобби');
    } finally {
      setIsLoading(false);
    }
  };

  const joinLobby = async () => {
    if (!user || !lobbyId) return;

    try {
      setIsJoining(true);
      const response = await api.post('/lobby/join', {
        lobbyId,
        playerId: user.id,
        playerName: user.firstName,
        playerAvatar: user.photoUrl,
      });
      setLobby(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка присоединения к лобби');
    } finally {
      setIsJoining(false);
    }
  };

  const setReady = async () => {
    if (!lobbyId) return;

    try {
      setIsSettingReady(true);
      const response = await api.post(`/lobby/${lobbyId}/ready`);
      setLobby(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка установки статуса готовности');
    } finally {
      setIsSettingReady(false);
    }
  };

  const leaveLobby = async () => {
    if (!lobbyId) return;

    try {
      await api.post(`/lobby/${lobbyId}/leave`);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка выхода из лобби');
    }
  };

  const copyInviteLink = async () => {
    if (lobby?.inviteLink) {
      try {
        await navigator.clipboard.writeText(lobby.inviteLink);
        // Можно добавить toast уведомление
      } catch (err) {
        console.error('Ошибка копирования ссылки:', err);
      }
    }
  };

  const isInLobby = lobby?.players.some(p => p.id === user?.id);
  const currentPlayer = lobby?.players.find(p => p.id === user?.id);
  const isHost = currentPlayer?.isHost;
  const isReady = currentPlayer?.isReady;
  const allPlayersReady = lobby?.players.every(p => p.isReady) && lobby.players.length === 2;

  if (isLoading) {
    return <LoadingScreen status="connecting" message="Загрузка лобби..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-h2 text-torpedo mb-4">Ошибка</h2>
          <p className="text-body text-mist mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="primary">
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-h2 text-torpedo mb-4">Лобби не найдено</h2>
          <Button onClick={() => navigate('/')} variant="primary">
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-semibold text-h2 text-foam">
            Лобби
          </h1>
          <div className="text-caption text-mist">
            {lobby.players.length}/2 игроков
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Lobby Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-6"
        >
          <h2 className="font-heading font-semibold text-h3 text-foam mb-4">
            Информация о лобби
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body text-mist">Статус:</span>
              <span className={`font-heading font-semibold ${
                lobby.status === 'waiting' ? 'text-radio' :
                lobby.status === 'ready' ? 'text-sonar' :
                'text-torpedo'
              }`}>
                {lobby.status === 'waiting' ? 'Ожидание игроков' :
                 lobby.status === 'ready' ? 'Готовы к игре' :
                 'Игра началась'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-body text-mist">Создано:</span>
              <span className="font-mono text-caption text-mist">
                {new Date(lobby.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-6"
        >
          <h2 className="font-heading font-semibold text-h3 text-foam mb-4">
            Игроки
          </h2>
          
          <div className="space-y-4">
            {lobby.players.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-steel rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-graphite rounded-full ring-2 ring-edge flex items-center justify-center">
                    {player.avatar ? (
                      <img src={player.avatar} alt="Avatar" className="w-full h-full rounded-full" />
                    ) : (
                      <span className="font-heading font-semibold text-sonar">
                        {player.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-body text-foam">
                      {player.name}
                      {player.isHost && (
                        <span className="ml-2 text-caption text-radio">👑 Хост</span>
                      )}
                    </div>
                    <div className="text-caption text-mist">
                      {player.id === user?.id ? 'Вы' : 'Соперник'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {player.isReady ? (
                    <div className="flex items-center gap-1 text-sonar">
                      <div className="w-2 h-2 bg-sonar rounded-full"></div>
                      <span className="text-caption font-heading">Готов</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-mist">
                      <div className="w-2 h-2 bg-mist rounded-full"></div>
                      <span className="text-caption font-heading">Не готов</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {lobby.players.length < 2 && (
              <div className="text-center py-8 text-mist">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-body">Ожидание второго игрока...</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {!isInLobby ? (
            <Button
              onClick={joinLobby}
              disabled={isJoining || lobby.players.length >= 2}
              loading={isJoining}
              className="w-full"
            >
              {isJoining ? 'Присоединение...' : 'Присоединиться к лобби'}
            </Button>
          ) : (
            <>
              {isHost && (
                <Button
                  onClick={copyInviteLink}
                  variant="secondary"
                  className="w-full"
                >
                  📋 Скопировать ссылку приглашения
                </Button>
              )}
              
              {!isReady && (
                <Button
                  onClick={setReady}
                  disabled={isSettingReady}
                  loading={isSettingReady}
                  className="w-full"
                >
                  {isSettingReady ? 'Установка статуса...' : 'Готов к игре'}
                </Button>
              )}
              
              {isReady && !allPlayersReady && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-sonar mb-2">
                    <div className="w-2 h-2 bg-sonar rounded-full animate-pulse"></div>
                    <span className="font-heading font-semibold">Ожидание готовности соперника...</span>
                  </div>
                </div>
              )}
              
              {allPlayersReady && (
                <div className="text-center py-4">
                  <div className="text-sonar text-h3 mb-2">🎯</div>
                  <p className="font-heading font-semibold text-sonar">
                    Оба игрока готовы! Игра начинается...
                  </p>
                </div>
              )}
              
              <Button
                onClick={leaveLobby}
                variant="danger"
                className="w-full"
              >
                Покинуть лобби
              </Button>
            </>
          )}
          
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="w-full"
          >
            Вернуться на главную
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
