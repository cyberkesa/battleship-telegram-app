import React from 'react';

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
  primary: 'relative rounded-lg ring-1 ring-sonar bg-bg-deep hover:bg-steel text-foam transition-colors duration-150',
  secondary: 'rounded-lg bg-bg-graphite ring-1 ring-edge text-foam hover:bg-steel transition-colors duration-150',
  danger: 'rounded-lg bg-torpedo text-white hover:opacity-90 transition-opacity duration-150',
  ghost: 'rounded-lg text-mist hover:text-foam hover:bg-steel/50 transition-colors duration-150',
} as const;

const sizeClasses = {
  sm: 'px-3 py-2 text-secondary',
  md: 'px-5 py-3 text-body',
  lg: 'px-6 py-4 text-h3',
} as const;

const loadingSpinner = (
  <div className="w-4 h-4 border-2 border-foam/30 border-t-foam rounded-full animate-spin" />
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
  const baseClasses = 'font-medium font-heading focus:outline-none focus:ring-2 focus:ring-info/40 disabled:opacity-50 disabled:cursor-not-allowed';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <div className="flex items-center justify-center gap-2">
        {loading ? loadingSpinner : icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="font-heading font-semibold">{children}</span>
      </div>
    </button>
  );
};
