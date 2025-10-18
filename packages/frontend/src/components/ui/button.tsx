import React from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<ButtonVariant, string> = {
    default: 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-400',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-gray-300',
    ghost: 'text-gray-900 hover:bg-gray-50 focus:ring-gray-300',
  };
  const sizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      className={[base, variants[variant], sizes[size], className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;