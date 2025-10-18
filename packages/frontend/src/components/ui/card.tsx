import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={['rounded-lg border bg-white text-black shadow-sm', className].filter(Boolean).join(' ')}
    {...props}
  />
);

export const CardHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={['p-4 border-b', className].filter(Boolean).join(' ')}
    {...props}
  />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={['text-lg font-semibold leading-none tracking-tight', className].filter(Boolean).join(' ')}
    {...props}
  />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={['text-sm text-gray-500', className].filter(Boolean).join(' ')}
    {...props}
  />
);

export const CardContent: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={['p-4', className].filter(Boolean).join(' ')}
    {...props}
  />
);

export default Card;