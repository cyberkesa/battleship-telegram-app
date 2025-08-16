/// <reference types="vite/client" />

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
    start_param?: string;
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
    setText: (_text: string) => void;
    onClick: (_callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (_callback: () => void) => void;
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
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
}

declare global {
  // eslint-disable-next-line no-unused-vars
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
  const [startParam, setStartParam] = useState<string>('');

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
      if (tg.initDataUnsafe.start_param) {
        setStartParam(tg.initDataUnsafe.start_param);
      }
      setIsReady(true);
    }
  }, []);

  const showMainButton = (_text: string, _callback: () => void) => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.MainButton.setText(_text);
      tg.MainButton.onClick(_callback);
      tg.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.MainButton.hide();
    }
  };

  const showBackButton = (_callback: () => void) => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.BackButton.onClick(_callback);
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
    startParam,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    closeApp
  };
};
