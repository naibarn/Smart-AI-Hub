import * as React from 'react';
import { motion } from 'framer-motion';
import { Box, CircularProgress, CircularProgressProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface LoadingSpinnerProps extends Omit<CircularProgressProps, 'color' | 'variant'> {
  size?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'inherit';
  overlay?: boolean;
  text?: string;
  variant?: 'circular' | 'dots' | 'pulse';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color = 'primary',
  overlay = false,
  text,
  variant = 'circular',
  ...props
}) => {
  const theme = useTheme();

  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'accent':
        return (theme.palette as any).accent.main;
      default:
        return 'inherit';
    }
  };

  const renderCircularSpinner = () => (
    <CircularProgress
      size={size}
      sx={{
        color: getColor(),
        animation: 'spin 1s linear infinite',
        '@keyframes spin': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        ...props.sx,
      }}
      {...props}
    />
  );

  const renderDotsSpinner = () => (
    <Box sx={{ display: 'flex', gap: size / 8, alignItems: 'center' }}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          style={{
            width: size / 4,
            height: size / 4,
            borderRadius: '50%',
            backgroundColor: getColor(),
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </Box>
  );

  const renderPulseSpinner = () => (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: '50%',
            border: `2px solid ${getColor()}`,
            opacity: 1 - index * 0.3,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1 - index * 0.3, 0, 1 - index * 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.3,
            ease: 'easeOut',
          }}
        />
      ))}
    </Box>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return renderDotsSpinner();
      case 'pulse':
        return renderPulseSpinner();
      default:
        return renderCircularSpinner();
    }
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(overlay && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }),
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {renderSpinner()}
      </motion.div>
      {text && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Box
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {text}
          </Box>
        </motion.div>
      )}
    </Box>
  );

  return content;
};

export default LoadingSpinner;
