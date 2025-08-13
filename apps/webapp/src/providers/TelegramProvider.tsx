import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramContextType {
  webApp: any;
  isReady: boolean;
  theme: any;
  user: any;
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

interface TelegramProviderProps {
  children: React.ReactNode;
}

export const TelegramProvider: React.FC<TelegramProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize Telegram Web App
      tg.ready();
      tg.expand();

      setWebApp(tg);
      setTheme(tg.themeParams);
      setUser(tg.initDataUnsafe.user);
      setIsReady(true);

      // Apply theme colors to CSS variables
      document.documentElement.style.setProperty(
        '--tg-theme-bg-color',
        tg.themeParams.bg_color || '#ffffff'
      );
      document.documentElement.style.setProperty(
        '--tg-theme-text-color',
        tg.themeParams.text_color || '#000000'
      );
      document.documentElement.style.setProperty(
        '--tg-theme-hint-color',
        tg.themeParams.hint_color || '#999999'
      );
      document.documentElement.style.setProperty(
        '--tg-theme-link-color',
        tg.themeParams.link_color || '#2481cc'
      );
      document.documentElement.style.setProperty(
        '--tg-theme-button-color',
        tg.themeParams.button_color || '#2481cc'
      );
      document.documentElement.style.setProperty(
        '--tg-theme-button-text-color',
        tg.themeParams.button_text_color || '#ffffff'
      );
      document.documentElement.style.setProperty(
        '--tg-theme-secondary-bg-color',
        tg.themeParams.secondary_bg_color || '#f1f1f1'
      );
    }
  }, []);

  const value: TelegramContextType = {
    webApp,
    isReady,
    theme,
    user,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};
