export function buildLobbyDeepLink(id: string): string {
  const raw = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;
  const botUsername = raw?.startsWith('@') ? raw.slice(1) : raw;
  if (botUsername) {
    const payload = `join_${id}`;
    return `https://t.me/${botUsername}?startapp=${encodeURIComponent(payload)}`;
  }
  return `${window.location.origin}/lobby/${id}`;
}

export function openTelegramShare(deepLink: string, text: string): boolean {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(text)}`;
  const tg: any = (window as any).Telegram?.WebApp;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
    return true;
  }
  return false;
}

export function fromB64Url(s: string): string {
  if (!s) return s;
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  try { return atob(t); } catch { return ''; }
}
