import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  Users,
  User
} from 'lucide-react';
import { lobbyAPI } from '../services/api';

export const CreateLobbyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const [lobbyId, setLobbyId] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const inviteDeepLink = useMemo(() => {
    if (!lobbyId) return '';
    const raw = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
    const botUsername = raw?.startsWith('@') ? raw.slice(1) : raw;
    if (botUsername) {
      const payload = `join:${lobbyId}`;
      return `https://t.me/${botUsername}?startapp=${encodeURIComponent(payload)}`;
    }
    return `${window.location.origin}/lobby/${lobbyId}`;
  }, [lobbyId]);

  const openTelegramShare = (deepLink: string, text: string) => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(text)}`;
    const tg: any = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
      return true;
    }
    return false;
  };

  const handleCreateLobby = useCallback(async () => {
    if (isCreating) return;
    if (!user) { setCreateError('Не авторизованы'); return; }

    try {
      setIsCreating(true);
      setCreateError(null);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const res = await lobbyAPI.create(user.firstName || 'Игрок', user.photoUrl, { signal: ctrl.signal } as any);
      const lobby = res.data as { id: string; inviteLink?: string };
      if (!lobby?.id) throw new Error('Некорректный ответ сервера');
      setLobbyId(lobby.id);
      setInviteLink(lobby.inviteLink || inviteDeepLink);
      // Не навигируем сразу — даём возможность зашарить
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (import.meta.env.DEV) {
        console.error('[CreateLobby] request failed', { status, response: data, headers: err?.response?.headers, config: err?.config, message: err?.message });
      }
      let msg: any = data?.error || data?.message || err?.message || 'Не удалось создать лобби';
      if (status === 401) msg = 'Требуется повторная аутентификация';
      if (status === 429) msg = 'Слишком много запросов. Попробуйте позже';
      if (status >= 500) msg = 'Проблема на сервере. Повторите попытку';
      setCreateError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, user, inviteDeepLink]);

  const handleCopyLink = useCallback(async () => {
    const link = inviteLink || inviteDeepLink;
    const tg: any = (window as any).Telegram?.WebApp;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      tg?.HapticFeedback?.notificationOccurred?.('success');
      tg?.showPopup?.({ title: 'Ссылка скопирована', message: link, buttons: [{ type: 'ok' }] });
    } catch (err) {
      console.error('Ошибка копирования:', err);
      tg?.showPopup?.({ title: 'Ошибка', message: 'Не удалось скопировать ссылку', buttons: [{ type: 'ok' }] });
    }
  }, [inviteLink, inviteDeepLink]);

  const handleShare = useCallback(async () => {
    const deepLink = inviteLink || inviteDeepLink;
    const text = 'Приглашаю тебя сыграть в Морской бой!';
    if (!openTelegramShare(deepLink, text)) {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Присоединяйся к игре Морской бой', text, url: deepLink });
          return;
        } catch (err) {
          console.error('Ошибка шаринга:', err);
        }
      }
      await handleCopyLink();
    }
  }, [inviteLink, inviteDeepLink, handleCopyLink]);

  const handleJoinLobby = () => { navigate(`/lobby/${lobbyId}`); };
  const handleBack = () => { navigate('/'); };

  return (
    <div className="min-h-screen bg-bg-deep text-foam" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 bg-bg-graphite rounded-lg hover:bg-steel transition-colors" aria-label="Назад">
              <ArrowLeft className="w-5 h-5 text-mist" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-semibold text-h2 text-foam truncate">Игра с другом</h1>
              <p className="text-secondary text-mist truncate">Создайте лобби и пригласите друга</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* ...unchanged blocks above... */}

        {/* Create Lobby */}
        <div className="bg-bg-graphite rounded-card ring-1 ring-edge p-4">
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">Создать лобби</h3>
          {/* ...auth status blocks... */}
          {!lobbyId ? (
            <Button variant="primary" size="lg" onClick={handleCreateLobby} loading={isCreating} disabled={isCreating || !isAuthenticated} className="w-full flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" /> {isCreating ? 'Создание...' : 'Создать лобби'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-steel rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-sonar" />
                  <span className="font-heading font-semibold text-body text-foam">Лобби создано!</span>
                </div>
                <p className="text-caption text-mist">ID: {lobbyId}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" size="lg" onClick={handleShare} className="flex-1 flex items-center justify-center gap-2" aria-label="Поделиться ссылкой">
                  <Share className="w-4 h-4" /> Пригласить друга
                </Button>
                <Button variant="secondary" size="lg" onClick={handleCopyLink} className="flex items-center justify-center gap-2" aria-label="Скопировать ссылку">
                  <Copy className="w-4 h-4" /> {copied ? 'Скопировано' : 'Копировать'}
                </Button>
              </div>

              <Button variant="primary" size="lg" onClick={handleJoinLobby} className="w-full flex items-center justify-center gap-2" aria-label="Перейти в лобби">
                <Users className="w-4 h-4" /> Перейти в лобби
              </Button>
            </div>
          )}

          {createError && (
            <div className="mt-3 p-3 bg-torpedo/15 border border-torpedo/40 rounded-lg text-torpedo">
              <div className="text-sm font-medium">Не удалось создать лобби</div>
              <div className="text-caption opacity-90 break-words">{createError}</div>
            </div>
          )}
        </div>

        {/* Game Info block remains unchanged */}
      </div>
    </div>
  );
};