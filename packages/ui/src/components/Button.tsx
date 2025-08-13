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
  primary: 'relative rounded-lg ring-1 ring-sonar bg-bg-deep hover:bg-steel text-foam transition-all duration-200 hover:ring-sonar/80 hover:shadow-sonar',
  secondary: 'rounded-lg bg-bg-graphite ring-1 ring-edge text-foam hover:bg-steel hover:ring-edge/80 transition-all duration-200',
  danger: 'rounded-lg bg-torpedo text-black hover:opacity-90 transition-all duration-200',
  ghost: 'rounded-lg text-mist hover:text-foam hover:bg-steel/50 transition-all duration-200',
};

const sizeClasses = {
  sm: 'px-3 py-2 text-secondary',
  md: 'px-5 py-3 text-body',
  lg: 'px-6 py-4 text-h3',
};

const loadingSpinner = (
  <motion.div
    className="w-4 h-4 border-2 border-foam/30 border-t-foam rounded-full"
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
);

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
  const baseClasses = 'font-medium font-heading focus:outline-none focus:ring-2 focus:ring-info/50 disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
    >
      <div className="flex items-center justify-center gap-2">
        {loading ? loadingSpinner : icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="font-heading font-semibold">{children}</span>
      </div>
    </motion.button>
  );
};
