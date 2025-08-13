import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'danger';
      loading?: boolean;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  className?: string;
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  className = '',
  closeOnBackdrop = true,
}) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            className={`
              relative w-full max-w-md bg-bg-graphite rounded-modal
              ring-1 ring-edge shadow-steel border border-edge/50
              ${className}
            `}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-edge/50">
              <h2 className="font-heading font-semibold text-h3 text-foam">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-mist hover:text-foam hover:bg-steel/50 transition-colors"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Контент */}
            <div className="p-6 pt-4">
              <div className="text-body text-mist leading-relaxed">
                {children}
              </div>
            </div>

            {/* Действия */}
            {actions && (
              <div className="flex gap-3 p-6 pt-0">
                {actions.secondary && (
                  <Button
                    variant="ghost"
                    onClick={actions.secondary.onClick}
                    className="flex-1"
                  >
                    {actions.secondary.label}
                  </Button>
                )}
                {actions.primary && (
                  <Button
                    variant={actions.primary.variant || 'primary'}
                    onClick={actions.primary.onClick}
                    loading={actions.primary.loading}
                    className="flex-1"
                  >
                    {actions.primary.label}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
