import React from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary: 'ring-1 ring-sonar bg-deep hover:bg-steel text-foam shadow-steel',
  secondary: 'ring-1 ring-edge bg-graphite hover:bg-steel text-foam',
  danger: 'bg-torpedo text-black hover:opacity-90',
  ghost: 'text-foam hover:bg-steel/50',
};

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  children,
  icon,
}) => {
  return (
    <motion.button
      className={`
        relative rounded-lg font-sans font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-sonar/50 focus:ring-offset-2 focus:ring-offset-deep
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-4 h-4 border-2 border-foam/30 border-t-foam rounded-full animate-spin" />
        </motion.div>
      )}
      
      <div className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
};
