import React from 'react';

type AlertVariant = 'default' | 'destructive';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'default', className, ...props }) => {
  const base =
    'w-full rounded-md border p-4 text-sm flex items-start gap-2';
  const variants: Record<AlertVariant, string> = {
    default: 'border-gray-300 bg-white text-gray-900',
    destructive: 'border-red-300 bg-red-50 text-red-800',
  };
  return (
    <div
      role="alert"
      className={[base, variants[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  );
};

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p className={['text-sm', className].filter(Boolean).join(' ')} {...props} />
);

export default Alert;