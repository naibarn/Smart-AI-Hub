import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from '@mui/material';
import { glassmorphism } from '../../theme/theme';

interface GlassCardProps extends CardProps {
  children: React.ReactNode;
  hover?: boolean;
  glow?: 'primary' | 'secondary' | 'accent' | 'none';
  delay?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hover = true,
  glow = 'none',
  delay = 0,
  sx,
  ...props
}) => {
  const getGlowShadow = () => {
    switch (glow) {
      case 'primary':
        return '0 0 20px rgba(59, 130, 246, 0.3)';
      case 'secondary':
        return '0 0 20px rgba(139, 92, 246, 0.3)';
      case 'accent':
        return '0 0 20px rgba(16, 185, 129, 0.3)';
      default:
        return glassmorphism.boxShadow;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
    >
      <Card
        {...props}
        sx={{
          background: glassmorphism.background,
          backdropFilter: glassmorphism.backdropFilter,
          border: glassmorphism.border,
          boxShadow: getGlowShadow(),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: hover ? 'pointer' : 'default',
          ...sx,
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default GlassCard;