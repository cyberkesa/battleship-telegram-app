import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@battleship/ui';
import { useAuth } from '../providers/AuthProvider';
import { 
  UserPlus,
  Copy,
  Share,
  Clock,
  ArrowLeft,
  CheckCircle,
  Users
} from 'lucide-react';
import { lobbyAPI } from '../services/api';

export const CreateLobbyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lobbyId, setLobbyId] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const [copied, setCopied] = useState(false);

  const buildLobbyDeepLink = (id: string) => {
    const raw = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
    const botUsername = raw?.startsWith('@') ? raw.slice(1) : raw;
    if (botUsername) {
      const payload = `join:${id}`;
      return `https://t.me/${botUsername}?startapp=${encodeURIComponent(payload)}`;
    }
    return `${window.location.origin}/lobby/${id}`;
  };

  const openTelegramShare = (deepLink: string, text: string) => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(text)}`;
    const tg: any = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
      return true;
    }
    return false;
  };

  const handleCreateLobby = async () => {
    if (!user) return;

    try {
      setIsCreating(true);

      const res = await lobbyAPI.create(user.firstName || 'Игрок', user.photoUrl);
      const lobby = res.data as { id: string; inviteLink: string };
      setLobbyId(lobby.id);
      setInviteLink(lobby.inviteLink || buildLobbyDeepLink(lobby.id));
    } catch (err: any) {
      console.error('Ошибка создания лобби:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    const link = inviteLink || buildLobbyDeepLink(lobbyId);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const handleShare = async () => {
    const deepLink = inviteLink || buildLobbyDeepLink(lobbyId);
    const text = 'Приглашаю тебя сыграть в Морской бой!';
    if (!openTelegramShare(deepLink, text)) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Присоединяйся к игре Морской бой',
            text,
            url: deepLink
          });
        } catch (err) {
          console.error('Ошибка шаринга:', err);
        }
      } else {
        handleCopyLink();
      }
    }
  };

  const handleJoinLobby = () => {
    navigate(`/lobby/${lobbyId}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 bg-bg-graphite rounded-lg hover:bg-steel transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-mist" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-semibold text-h2 text-foam truncate">
                Игра с другом
              </h1>
              <p className="text-secondary text-mist truncate">
                Создайте лобби и пригласите друга
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Instructions */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-3">
            Как играть с другом
          </h3>
          <div className="space-y-3 text-body text-mist">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-sonar rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <p>Создайте лобби и получите ссылку для приглашения</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-sonar rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <p>Отправьте ссылку другу через Telegram или скопируйте</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-sonar rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <p>Когда друг присоединится, начнется расстановка кораблей (80 секунд)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-sonar rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <p>После расстановки начнется игра с таймером 5 секунд на ход</p>
            </div>
          </div>
        </div>

        {/* Create Lobby */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Создать лобби
          </h3>
          
          {!lobbyId ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateLobby}
              loading={isCreating}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {isCreating ? 'Создание...' : 'Создать лобби'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-steel rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-sonar" />
                  <span className="font-heading font-semibold text-body text-foam">
                    Лобби создано!
                  </span>
                </div>
                <p className="text-caption text-mist">
                  ID: {lobbyId}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Скопировано!' : 'Копировать'}
                </Button>
                
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  Поделиться
                </Button>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleJoinLobby}
                className="w-full flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Перейти в лобби
              </Button>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-3">
            Информация об игре
          </h3>
          <div className="space-y-2 text-body text-mist">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sonar" />
              <span>Расстановка кораблей: 80 секунд</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sonar" />
              <span>Время на ход: 5 секунд</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-info" />
              <span>Игроков: 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
