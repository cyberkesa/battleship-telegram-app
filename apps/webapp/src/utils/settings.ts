export type Settings = {
  language: string;
  notifications: 'default' | 'granted' | 'denied';
  vibration: boolean;
};

const LS_KEYS = {
  language: 'app_lang',
  vibration: 'app_vibration',
} as const;

export function getSettings(): Settings {
  let language = 'ru';
  let vibration = true;
  try {
    const l = localStorage.getItem(LS_KEYS.language);
    if (l) language = l;
    const v = localStorage.getItem(LS_KEYS.vibration);
    if (v !== null) vibration = v === '1';
  } catch {}
  const notifications: NotificationPermission = (typeof Notification !== 'undefined' ? Notification.permission : 'default');
  return { language, notifications, vibration };
}

export function setLanguage(code: string) {
  try { localStorage.setItem(LS_KEYS.language, code); } catch {}
}

export async function requestNotifications(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined' || !('requestPermission' in Notification)) return 'default';
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch {
    return Notification.permission;
  }
}

export function setVibrationEnabled(enabled: boolean) {
  try { localStorage.setItem(LS_KEYS.vibration, enabled ? '1' : '0'); } catch {}
}

export function vibrateShort() {
  try {
    const s = getSettings();
    if (!s.vibration) return;
    if ('vibrate' in navigator) (navigator as any).vibrate?.(20);
  } catch {}
}

