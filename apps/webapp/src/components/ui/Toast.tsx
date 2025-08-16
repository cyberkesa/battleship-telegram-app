import React from 'react';
import { X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

const typeStyles = {
  success: 'bg-success/10 ring-1 ring-success/30 text-success',
  error: 'bg-torpedo/10 ring-1 ring-torpedo/30 text-torpedo',
  warning: 'bg-amber/10 ring-1 ring-amber/30 text-amber',
  info: 'bg-info/10 ring-1 ring-info/30 text-info',
} as const;

const typeIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
} as const;

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose,
  duration = 2500,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        rounded-xl bg-graphite ring-1 ring-edge
        ${typeStyles[type]}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm font-bold">
            {typeIcons[type]}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-sans font-semibold text-foam">
              {title}
            </h4>
            {message && (
              <p className="text-xs text-mist mt-1">
                {message}
              </p>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-mist hover:text-foam"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
