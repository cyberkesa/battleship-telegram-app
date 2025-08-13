import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState<string>('');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize Telegram Web App
      tg.ready();
      tg.expand();
      
      // Set user data
      if (tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      setInitData(tg.initData);
      setIsReady(true);
    }
  }, []);

  const showMainButton = (text: string, callback: () => void) => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.MainButton.setText(text);
      tg.MainButton.onClick(callback);
      tg.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.MainButton.hide();
    }
  };

  const showBackButton = (callback: () => void) => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.BackButton.onClick(callback);
      tg.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.BackButton.hide();
    }
  };

  const closeApp = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return {
    user,
    isReady,
    initData,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    closeApp
  };
};
