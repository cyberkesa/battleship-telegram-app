import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
}) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div
            className={`
              relative w-full max-w-md max-h-[90vh] overflow-hidden
              rounded-xl bg-graphite ring-1 ring-edge
              ${className}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-edge">
              <h2 className="text-lg font-sans font-semibold text-foam">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center text-mist hover:text-foam rounded-lg hover:bg-steel"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
