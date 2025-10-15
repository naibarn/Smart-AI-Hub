import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Plus, Zap, TrendingUp, Sparkles } from 'lucide-react';

interface CreditBadgeProps {
  credits: number;
  change?: number;
  animated?: boolean;
  showParticles?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'card' | 'chip' | 'minimal';
  onTopUp?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
}

const CreditBadge: React.FC<CreditBadgeProps> = ({
  credits,
  change = 0,
  animated = true,
  showParticles = false,
  size = 'medium',
  variant = 'card',
  onTopUp,
}) => {
  const theme = useTheme();
  const [displayCredits, setDisplayCredits] = React.useState(credits);
  const [particles, setParticles] = React.useState<Particle[]>([]);

  React.useEffect(() => {
    if (animated) {
      const duration = 1000;
      const steps = 30;
      const increment = (credits - displayCredits) / steps;
      let current = displayCredits;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        setDisplayCredits(Math.round(current));

        if (step >= steps) {
          setDisplayCredits(credits);
          clearInterval(timer);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayCredits(credits);
    }
  }, [credits, animated, displayCredits]);

  React.useEffect(() => {
    if (showParticles && credits > displayCredits) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 5; i++) {
        newParticles.push({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
        });
      }

      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [credits, displayCredits, showParticles]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '8px 12px',
          fontSize: '0.875rem',
          iconSize: 16,
        };
      case 'large':
        return {
          padding: '16px 24px',
          fontSize: '1.5rem',
          iconSize: 24,
        };
      default:
        return {
          padding: '12px 20px',
          fontSize: '1.125rem',
          iconSize: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderCardVariant = () => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'relative',
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: '12px',
          padding: sizeStyles.padding,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
        }}
      >
        {/* Background glow effect */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Zap size={sizeStyles.iconSize} />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Available Credits
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <Typography variant="h4" sx={{ fontSize: sizeStyles.fontSize, fontWeight: 700 }}>
              {displayCredits.toLocaleString()}
            </Typography>

            {change !== 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Chip
                  icon={<TrendingUp size={14} />}
                  label={`${change > 0 ? '+' : ''}${change}`}
                  size="small"
                  sx={{
                    backgroundColor:
                      change > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: change > 0 ? '#10B981' : '#EF4444',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </motion.div>
            )}
          </Box>

          {onTopUp && (
            <Box sx={{ mt: 2 }}>
              <IconButton
                onClick={onTopUp}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                <Plus size={16} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Particles */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 1,
                scale: 0,
              }}
              animate={{
                x: particle.x + (Math.random() - 0.5) * 50,
                y: particle.y - 50,
                opacity: 0,
                scale: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '50%',
              }}
            />
          ))}
        </AnimatePresence>
      </Box>
    </motion.div>
  );

  const renderChipVariant = () => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Chip
        icon={<Sparkles size={16} />}
        label={`${displayCredits.toLocaleString()} credits`}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: sizeStyles.fontSize,
          padding: sizeStyles.padding,
          '& .MuiChip-icon': {
            color: '#FFFFFF',
          },
        }}
      />
    </motion.div>
  );

  const renderMinimalVariant = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles size={sizeStyles.iconSize} color={theme.palette.primary.main} />
      </motion.div>
      <Typography
        variant="body1"
        sx={{
          fontSize: sizeStyles.fontSize,
          fontWeight: 600,
          color: theme.palette.text.primary,
        }}
      >
        {displayCredits.toLocaleString()}
      </Typography>
      {change !== 0 && (
        <Typography
          variant="body2"
          sx={{
            color: change > 0 ? theme.palette.success.main : theme.palette.error.main,
            fontSize: '0.75rem',
          }}
        >
          ({change > 0 ? '+' : ''}
          {change})
        </Typography>
      )}
    </Box>
  );

  switch (variant) {
    case 'chip':
      return renderChipVariant();
    case 'minimal':
      return renderMinimalVariant();
    default:
      return renderCardVariant();
  }
};

export default CreditBadge;
