import React from 'react';

type BadgeVariant = 'default' | 'destructive' | 'outline';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className, ...props }) => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const styles = {
    default: 'bg-gray-900 text-white',
    destructive: 'bg-red-600 text-white',
    outline: 'border border-gray-300 text-gray-700',
  } as const;
  return (
    <span className={[base, styles[variant], className].filter(Boolean).join(' ')} {...props} />
  );
};

export default Badge;
