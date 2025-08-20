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

// The alternative settings API below was removed to avoid duplicate exports.

