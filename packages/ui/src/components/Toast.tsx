import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  className?: string;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    textColor: 'text-success',
    iconColor: 'text-success',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-torpedo/10',
    borderColor: 'border-torpedo/30',
    textColor: 'text-torpedo',
    iconColor: 'text-torpedo',
  },
  info: {
    icon: Info,
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
    textColor: 'text-info',
    iconColor: 'text-info',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-radio/10',
    borderColor: 'border-radio/30',
    textColor: 'text-radio',
    iconColor: 'text-radio',
  },
};

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration = 2500,
  onClose,
  className = '',
}) => {
  const config = toastConfig[type];
  const Icon = config.icon;
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        rounded-card border bg-bg-graphite
        ${config.bgColor} ${config.borderColor} ${className}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Иконка */}
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            <Icon size={20} strokeWidth={2} />
          </div>

          {/* Контент */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-heading font-semibold text-body ${config.textColor}`}>
              {title}
            </h4>
            {message && (
              <p className="mt-1 text-secondary text-mist">
                {message}
              </p>
            )}
          </div>

          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-md text-mist hover:text-foam hover:bg-steel/50 transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Прогресс-бар */}
      {duration > 0 && (
        <div
          ref={barRef}
          className={`${config.bgColor.replace('/10', '/20')} h-1`}
          style={{ width: '100%', transition: `width ${duration}ms linear` }}
          onAnimationStart={() => {
            if (barRef.current) {
              // Trigger layout to ensure transition
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              barRef.current.offsetWidth;
              barRef.current.style.width = '0%';
            }
          }}
        />
      )}
    </div>
  );
};
