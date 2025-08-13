import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { Board, CellState } from './Board';
import { Cell } from './Cell';
import { RingTimer } from './RingTimer';
import { TurnBadge } from './TurnBadge';
import { Toast, ToastType } from './Toast';
import { Modal } from './Modal';
import { LoadingScreen } from './LoadingScreen';
import { LobbyScreen } from './LobbyScreen';
import { GameScreen } from './GameScreen';
import { Play, Users, BookOpen, Settings, History, Package, Target, RotateCcw } from 'lucide-react';

type DemoSection = 'components' | 'screens' | 'colors' | 'typography';

export const DesignSystemDemo: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<DemoSection>('components');
  const [toast, setToast] = useState<{ type: ToastType; title: string; message?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Создаем демо-сетку
  const createDemoBoard = (): CellState[][] => {
    const board = Array(10).fill(null).map(() => Array(10).fill('idle'));
    // Добавляем несколько кораблей и попаданий для демо
    board[2][3] = 'ship';
    board[2][4] = 'ship';
    board[2][5] = 'ship';
    board[5][7] = 'hit';
    board[7][2] = 'miss';
    board[8][8] = 'sunk';
    return board;
  };

  const showToast = (type: ToastType, title: string, message?: string) => {
    setToast({ type, title, message });
  };

  const renderComponentsSection = () => (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Кнопки</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Клетки</h2>
        <div className="grid grid-cols-6 gap-4">
          <Cell state="idle" size="md" />
          <Cell state="hover" size="md" />
          <Cell state="selected" size="md" />
          <Cell state="miss" size="md" />
          <Cell state="hit" size="md" />
          <Cell state="sunk" size="md" />
        </div>
        <div className="grid grid-cols-6 gap-4 mt-4">
          <Cell state="ship" size="md" />
          <Cell state="ship-hit" size="md" />
          <Cell state="ship-sunk" size="md" />
          <Cell state="disabled" size="md" />
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Сетка</h2>
        <div className="max-w-md">
          <Board cells={createDemoBoard()} />
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Таймер</h2>
        <div className="flex items-center gap-4">
          <RingTimer duration={60} currentTime={45} size="sm" />
          <RingTimer duration={60} currentTime={30} size="md" />
          <RingTimer duration={60} currentTime={10} size="lg" />
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Индикатор хода</h2>
        <div className="flex items-center gap-4">
          <TurnBadge isMyTurn={true} timeLeft={30} />
          <TurnBadge isMyTurn={false} timeLeft={15} />
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Уведомления</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => showToast('success', 'Успех!', 'Операция выполнена')}>
            Success Toast
          </Button>
          <Button onClick={() => showToast('error', 'Ошибка!', 'Что-то пошло не так')}>
            Error Toast
          </Button>
          <Button onClick={() => showToast('info', 'Информация', 'Полезная информация')}>
            Info Toast
          </Button>
          <Button onClick={() => showToast('warning', 'Предупреждение', 'Будьте осторожны')}>
            Warning Toast
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Модальные окна</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setShowModal(true)}>
            Открыть модалку
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Загрузка</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setShowLoading(true)}>
            Показать загрузку
          </Button>
        </div>
      </section>
    </div>
  );

  const renderScreensSection = () => (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Лобби</h2>
        <div className="bg-bg-graphite rounded-card p-4">
          <LobbyScreen
            onQuickPlay={() => showToast('info', 'Быстрый бой', 'Поиск соперника...')}
            onPlayWithFriend={() => showToast('info', 'Игра с другом', 'Создание игры...')}
            onTutorial={() => showToast('info', 'Обучение', 'Запуск обучения...')}
            onHistory={() => showToast('info', 'История', 'Открытие истории...')}
            onInventory={() => showToast('info', 'Инвентарь', 'Открытие инвентаря...')}
            onSettings={() => showToast('info', 'Настройки', 'Открытие настроек...')}
            userProfile={{ name: 'Демо Игрок', rating: 1250 }}
          />
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Игра</h2>
        <div className="bg-bg-graphite rounded-card p-4">
          <GameScreen
            onBackToLobby={() => showToast('info', 'Возврат в лобби')}
            onSurrender={() => showToast('warning', 'Сдача', 'Игра завершена')}
          />
        </div>
      </section>
    </div>
  );

  const renderColorsSection = () => (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Основные цвета</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bg-deep h-20 rounded-card ring-1 ring-edge flex items-center justify-center">
            <span className="font-mono text-caption text-foam">bg-deep</span>
          </div>
          <div className="bg-bg-graphite h-20 rounded-card ring-1 ring-edge flex items-center justify-center">
            <span className="font-mono text-caption text-foam">bg-graphite</span>
          </div>
          <div className="bg-steel h-20 rounded-card ring-1 ring-edge flex items-center justify-center">
            <span className="font-mono text-caption text-foam">steel</span>
          </div>
          <div className="bg-edge h-20 rounded-card ring-1 ring-edge flex items-center justify-center">
            <span className="font-mono text-caption text-foam">edge</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Акценты</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-sonar h-20 rounded-card ring-1 ring-edge flex items-center justify-center">
            <span className="font-mono text-caption text-black">sonar</span>
          </div>
          <div className="bg-torpedo h-20 rounded-card ring-1 ring-edge flex items-center justify-center">
            <span className="font-mono text-caption text-black">torpedo</span>
          </div>
          <div className="bg-radio h-20 rounded-card ring-1 ring-edge flex items-center justify-center">
            <span className="font-mono text-caption text-black">radio</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Текст</h2>
        <div className="space-y-4">
          <div className="bg-bg-graphite p-4 rounded-card">
            <p className="text-foam text-body">Основной текст (foam)</p>
            <p className="text-mist text-body">Вторичный текст (mist)</p>
            <p className="text-mute text-body">Немой текст (mute)</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderTypographySection = () => (
    <div className="space-y-8">
      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Заголовки</h2>
        <div className="space-y-4">
          <h1 className="font-heading font-semibold text-h1 text-foam">Заголовок H1 (22px)</h1>
          <h2 className="font-heading font-semibold text-h2 text-foam">Заголовок H2 (18px)</h2>
          <h3 className="font-heading font-semibold text-h3 text-foam">Заголовок H3 (16px)</h3>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Текст</h2>
        <div className="space-y-4">
          <p className="font-heading text-body text-foam">Основной текст (14px) - Inter</p>
          <p className="font-heading text-secondary text-mist">Вторичный текст (13px) - Inter</p>
          <p className="font-heading text-caption text-mute">Подпись (12px) - Inter</p>
        </div>
      </section>

      <section>
        <h2 className="font-heading font-semibold text-h2 text-foam mb-4">Моноширинный текст</h2>
        <div className="space-y-4">
          <p className="font-mono text-body text-foam">Координаты A1-J10 (14px) - IBM Plex Mono</p>
          <p className="font-mono text-secondary text-mist">Таймер 00:30 (13px) - IBM Plex Mono</p>
          <p className="font-mono text-caption text-mute">Статистика (12px) - IBM Plex Mono</p>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-deep text-foam">
      {/* Навигация */}
      <div className="bg-steel border-b border-edge/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-semibold text-h1 text-foam">
            Design System Demo
          </h1>
          <div className="flex gap-2">
            {(['components', 'screens', 'colors', 'typography'] as DemoSection[]).map((section) => (
              <button
                key={section}
                onClick={() => setCurrentSection(section)}
                className={`px-3 py-1 rounded-lg font-heading text-caption transition-colors ${
                  currentSection === section
                    ? 'bg-sonar text-black'
                    : 'text-mist hover:text-foam hover:bg-bg-graphite'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="p-6">
        {currentSection === 'components' && renderComponentsSection()}
        {currentSection === 'screens' && renderScreensSection()}
        {currentSection === 'colors' && renderColorsSection()}
        {currentSection === 'typography' && renderTypographySection()}
      </div>

      {/* Toast уведомления */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Модальное окно */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Демо модальное окно"
        actions={{
          primary: {
            label: 'Подтвердить',
            onClick: () => {
              setShowModal(false);
              showToast('success', 'Подтверждено!');
            }
          },
          secondary: {
            label: 'Отмена',
            onClick: () => setShowModal(false)
          }
        }}
      >
        Это демонстрация модального окна. Здесь может быть любой контент.
      </Modal>

      {/* Загрузочный экран */}
      {showLoading && (
        <LoadingScreen
          status="connecting"
          message="Демонстрация загрузки..."
          onRetry={() => setShowLoading(false)}
        />
      )}
    </div>
  );
};
