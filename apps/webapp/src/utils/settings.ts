export interface AppSettings {
  language: string;
  notificationsEnabled: boolean;
  vibrationEnabled: boolean;
}

const LANGUAGE_KEY = 'app_language';
const NOTIFICATIONS_KEY = 'notifications_enabled';
const VIBRATION_KEY = 'vibration_enabled';

export function getAppSettings(): AppSettings {
  let language = 'ru';
  let notificationsEnabled = false;
  let vibrationEnabled = true;
  try {
    const l = localStorage.getItem(LANGUAGE_KEY);
    if (l) language = l;
    const n = localStorage.getItem(NOTIFICATIONS_KEY);
    if (n !== null) notificationsEnabled = n === '1';
    const v = localStorage.getItem(VIBRATION_KEY);
    if (v !== null) vibrationEnabled = v === '1';
  } catch {}
  return { language, notificationsEnabled, vibrationEnabled };
}

export function setLanguage(code: string) {
  try { localStorage.setItem(LANGUAGE_KEY, code); } catch {}
}

export async function setNotificationsEnabled(enabled: boolean): Promise<boolean> {
  let final = false;
  try {
    if (!('Notification' in window)) {
      localStorage.setItem(NOTIFICATIONS_KEY, '0');
      return false;
    }
    if (!enabled) {
      localStorage.setItem(NOTIFICATIONS_KEY, '0');
      return false;
    }
    const perm = Notification.permission;
    if (perm === 'granted') {
      final = true;
    } else if (perm === 'denied') {
      final = false;
    } else {
      try {
        const req = await Notification.requestPermission();
        final = req === 'granted';
      } catch {
        final = false;
      }
    }
    localStorage.setItem(NOTIFICATIONS_KEY, final ? '1' : '0');
    return final;
  } catch {
    return false;
  }
}

export function setVibrationEnabled(enabled: boolean) {
  try { localStorage.setItem(VIBRATION_KEY, enabled ? '1' : '0'); } catch {}
  if (enabled) vibrate(12);
}

export function vibrate(durationMs: number | number[]) {
  try {
    const v = navigator.vibrate || (navigator as any).mozVibrate || (navigator as any).webkitVibrate;
    if (!v) return;
    const settings = getAppSettings();
    if (!settings.vibrationEnabled) return;
    v.call(navigator, durationMs);
  } catch {}
}

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

