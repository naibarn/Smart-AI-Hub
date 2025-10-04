import * as React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface GradientButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'gradient';
  glow?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  variant = 'primary',
  glow = false,
  pulse = false,
  children,
  sx,
  ...props
}) => {
  const theme = useTheme();

  const getGradient = () => {
    switch (variant) {
      case 'primary':
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
      case 'secondary':
        return `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`;
      case 'accent':
        return `linear-gradient(135deg, ${(theme.palette as any).accent.main} 0%, ${(theme.palette as any).accent.dark} 100%)`;
      case 'gradient':
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${(theme.palette as any).accent.main} 100%)`;
      default:
        return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`;
    }
  };

  const getHoverGradient = () => {
    switch (variant) {
      case 'primary':
        return `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`;
      case 'secondary':
        return `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`;
      case 'accent':
        return `linear-gradient(135deg, ${(theme.palette as any).accent.light} 0%, ${(theme.palette as any).accent.main} 100%)`;
      case 'gradient':
        return `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 50%, ${(theme.palette as any).accent.light} 100%)`;
      default:
        return `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`;
    }
  };

  const getGlowShadow = () => {
    if (!glow) return 'none';
    switch (variant) {
      case 'primary':
        return '0 0 20px rgba(59, 130, 246, 0.5)';
      case 'secondary':
        return '0 0 20px rgba(139, 92, 246, 0.5)';
      case 'accent':
        return '0 0 20px rgba(16, 185, 129, 0.5)';
      case 'gradient':
        return '0 0 20px rgba(59, 130, 246, 0.5)';
      default:
        return '0 0 20px rgba(59, 130, 246, 0.5)';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      <Button
        {...props}
        variant="contained"
        sx={{
          background: getGradient(),
          color: '#FFFFFF',
          fontWeight: 600,
          padding: '12px 32px',
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: '0.875rem',
          boxShadow: getGlowShadow(),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: 'none',
          '&:hover': {
            background: getHoverGradient(),
            boxShadow: glow ? '0 0 30px rgba(59, 130, 246, 0.7)' : '0 8px 25px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            background: theme.palette.action.disabled,
            color: theme.palette.action.disabled,
            boxShadow: 'none',
          },
          ...sx,
        }}
      >
        {children}
      </Button>
    </motion.div>
  );
};

export default GradientButton;