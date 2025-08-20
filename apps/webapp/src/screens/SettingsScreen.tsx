import React, { useState } from 'react';
import { getSfxSettings, setSfxMuted, setSfxVolume, initSfx } from '../utils/sfx';
import { getAppSettings, setLanguage, setNotificationsEnabled, setVibrationEnabled } from '../utils/settings';
import { useNavigate } from 'react-router-dom';

import { 
  ArrowLeft,
  Globe,
  Volume2,
  Bell,
  Shield,
  HelpCircle,
  Info
} from 'lucide-react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: Language[] = [
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState(getAppSettings().language);
  const [notificationsEnabled, setNotifications] = useState(getAppSettings().notificationsEnabled);
  const [vibrationEnabled, setVibration] = useState(getAppSettings().vibrationEnabled);
  const [{ muted, volume }, setSfxState] = useState(getSfxSettings());
  const toggleMuted = () => { setSfxMuted(!muted); setSfxState(getSfxSettings()); };
  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => { setSfxVolume(Number(e.target.value)); setSfxState(getSfxSettings()); };
  React.useEffect(() => { initSfx(); }, []);

  const handleBack = () => {
    navigate('/');
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setLanguage(languageCode);
  };

  const toggleNotifications = async () => {
    const next = !notificationsEnabled;
    const allowed = await setNotificationsEnabled(next);
    setNotifications(allowed);
  };

  const toggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    setVibration(next);
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
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
                Настройки
              </h1>
              <p className="text-secondary text-mist truncate">
                Персонализация приложения
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Language Settings */}
        <div
          className="bg-bg-graphite rounded-card ring-1 ring-edge p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Язык
          </h3>
          
          <div className="space-y-2">
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedLanguage === language.code
                    ? 'border-sonar bg-sonar/10'
                    : 'border-edge hover:border-sonar/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-sonar rounded-full flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold text-body text-foam truncate">
                      {language.nativeName}
                    </div>
                    <div className="text-caption text-mist">
                      {language.name}
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <div className="w-4 h-4 bg-sonar rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Game Settings */}
        <div
          className="bg-bg-graphite rounded-card ring-1 ring-edge p-4"
        >
          <h3 className="font-heading font-semibold text-h3 text-foam mb-4">
            Игровые настройки
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-radio rounded-full flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-heading font-semibold text-body text-foam">
                    Звуки
                  </div>
                  <div className="text-caption text-mist">
                    Звуковые эффекты
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={muted} onChange={toggleMuted} />
                <span className="text-caption">Отключить</span>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-info rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-heading font-semibold text-body text-foam">
                    Громкость звуков
                  </div>
                  <div className="text-caption text-mist">
                    Общий уровень громкости
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={changeVolume} />
                <span className="text-caption">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-info rounded-full flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-heading font-semibold text-body text-foam">
                    Уведомления
                  </div>
                  <div className="text-caption text-mist">
                    Пуш-уведомления (если доступны)
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={notificationsEnabled} onChange={toggleNotifications} />
                <span className="text-caption">Разрешить</span>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-steel rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-radio rounded-full flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-white rotate-90" />
                </div>
                <div>
                  <div className="font-heading font-semibold text-body text-foam">
                    Вибрация
                  </div>
                  <div className="text-caption text-mist">
                    Тактильная отдача при событиях
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={vibrationEnabled} onChange={toggleVibration} />
                <span className="text-caption">Включить</span>
              </label>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        <div className="space-y-3">
          <button className="w-full p-4 bg-bg-graphite rounded-card ring-1 ring-edge text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-torpedo rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-semibold text-body text-foam truncate">
                  Безопасность
                </div>
                <div className="text-caption text-mist">
                  Настройки приватности
                </div>
              </div>
            </div>
          </button>

          <button className="w-full p-4 bg-bg-graphite rounded-card ring-1 ring-edge text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-radio rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-semibold text-body text-foam truncate">
                  Помощь
                </div>
                <div className="text-caption text-mist">
                  FAQ и поддержка
                </div>
              </div>
            </div>
          </button>

          <button className="w-full p-4 bg-bg-graphite rounded-card ring-1 ring-edge text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-heading font-semibold text-body text-foam truncate">
                  О приложении
                </div>
                <div className="text-caption text-mist">
                  Версия и информация
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
