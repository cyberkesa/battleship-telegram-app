import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const [selectedLanguage, setSelectedLanguage] = useState('ru');

  const handleBack = () => {
    navigate('/');
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    // Здесь можно добавить логику смены языка
  };

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
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
        </motion.div>

        {/* Game Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel p-4"
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
              <div className="w-12 h-6 bg-steel rounded-full border-2 border-edge relative">
                <div className="w-4 h-4 bg-sonar rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
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
                    Push-уведомления
                  </div>
                </div>
              </div>
              <div className="w-12 h-6 bg-steel rounded-full border-2 border-edge relative">
                <div className="w-4 h-4 bg-sonar rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Other Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <button className="w-full p-4 bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel hover:ring-sonar/50 transition-all text-left">
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

          <button className="w-full p-4 bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel hover:ring-sonar/50 transition-all text-left">
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

          <button className="w-full p-4 bg-bg-graphite rounded-card ring-1 ring-edge shadow-steel hover:ring-sonar/50 transition-all text-left">
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
        </motion.div>
      </div>
    </div>
  );
};
