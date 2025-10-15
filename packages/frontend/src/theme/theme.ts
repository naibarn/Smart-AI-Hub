import { createTheme } from '@mui/material/styles';

// Custom color palette
const palette = {
  primary: {
    main: '#3B82F6', // blue-500
    light: '#60A5FA', // blue-400
    dark: '#2563EB', // blue-600
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#8B5CF6', // purple-500
    light: '#A78BFA', // purple-400
    dark: '#7C3AED', // purple-600
    contrastText: '#FFFFFF',
  },
  accent: {
    main: '#10B981', // green-500
    light: '#34D399', // green-400
    dark: '#059669', // green-600
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0F172A', // slate-900
    paper: '#1E293B', // slate-800
  },
  surface: {
    main: '#1E293B', // slate-800
    light: '#334155', // slate-700
    dark: '#0F172A', // slate-900
  },
  text: {
    primary: '#F8FAFC', // slate-50
    secondary: '#CBD5E1', // slate-300
    disabled: '#64748B', // slate-500
  },
  divider: 'rgba(255, 255, 255, 0.1)',
  error: {
    main: '#EF4444', // red-500
    light: '#F87171', // red-400
    dark: '#DC2626', // red-600
  },
  warning: {
    main: '#F59E0B', // amber-500
    light: '#FBBf24', // amber-400
    dark: '#D97706', // amber-600
  },
  info: {
    main: '#06B6D4', // cyan-500
    light: '#22D3EE', // cyan-400
    dark: '#0891B2', // cyan-600
  },
  success: {
    main: '#10B981', // green-500
    light: '#34D399', // green-400
    dark: '#059669', // green-600
  },
};

// Custom shadows with glow effects
const shadows = [
  'none',
  '0px 2px 4px rgba(0, 0, 0, 0.05)',
  '0px 4px 8px rgba(0, 0, 0, 0.1)',
  '0px 8px 16px rgba(0, 0, 0, 0.15)',
  '0px 16px 32px rgba(0, 0, 0, 0.2)',
  '0px 24px 48px rgba(0, 0, 0, 0.25)',
  '0 0 20px rgba(59, 130, 246, 0.3)', // primary glow
  '0 0 20px rgba(139, 92, 246, 0.3)', // secondary glow
  '0 0 20px rgba(16, 185, 129, 0.3)', // accent glow
  '0 0 30px rgba(59, 130, 246, 0.5)', // strong primary glow
  '0 0 30px rgba(139, 92, 246, 0.5)', // strong secondary glow
  '0 0 30px rgba(16, 185, 129, 0.5)', // strong accent glow
  '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 16px rgba(0, 0, 0, 0.08)', // Glassmorphism shadow
  '0px 2px 4px rgba(0, 0, 0, 0.05)',
  '0px 4px 8px rgba(0, 0, 0, 0.1)',
  '0px 8px 16px rgba(0, 0, 0, 0.15)',
  '0px 16px 32px rgba(0, 0, 0, 0.2)',
  '0px 24px 48px rgba(0, 0, 0, 0.25)',
  '0 0 20px rgba(59, 130, 246, 0.3)',
  '0 0 20px rgba(139, 92, 246, 0.3)',
  '0 0 20px rgba(16, 185, 129, 0.3)',
  '0 0 30px rgba(59, 130, 246, 0.5)',
  '0 0 30px rgba(139, 92, 246, 0.5)',
  '0 0 30px rgba(16, 185, 129, 0.5)',
  '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 16px rgba(0, 0, 0, 0.08)',
  '0px 2px 4px rgba(0, 0, 0, 0.05)',
  '0px 4px 8px rgba(0, 0, 0, 0.1)',
  '0px 8px 16px rgba(0, 0, 0, 0.15)',
  '0px 16px 32px rgba(0, 0, 0, 0.2)',
] as const;

// Custom typography with fluid scaling
const typography = {
  fontFamily: `'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif`,
  h1: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.4,
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
};

// Custom border radius
const shape = {
  borderRadius: 12,
  borderRadiusSmall: 8,
  borderRadiusLarge: 16,
};

// Glassmorphism styles
const glassmorphism = {
  backdropFilter: 'blur(12px)',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 16px rgba(0, 0, 0, 0.08)',
};

// Create the theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    ...palette,
  },
  typography,
  shadows: shadows as any,
  shape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          fontFamily: `'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif`,
          backgroundColor: palette.background.default,
          color: palette.text.primary,
          lineHeight: 1.6,
          '&::selection': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
          },
        },
        '::webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '::webkit-scrollbar-track': {
          background: palette.surface.dark,
        },
        '::webkit-scrollbar-thumb': {
          background: palette.surface.light,
          borderRadius: '4px',
          '&:hover': {
            background: palette.divider,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadiusSmall,
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: shadows[4],
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${palette.primary.light} 0%, ${palette.primary.main} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${palette.secondary.main} 0%, ${palette.secondary.dark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${palette.secondary.light} 0%, ${palette.secondary.main} 100%)`,
          },
        },
        outlined: {
          border: `2px solid ${palette.divider}`,
          '&:hover': {
            border: `2px solid ${palette.primary.main}`,
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadius,
          background: glassmorphism.background,
          backdropFilter: glassmorphism.backdropFilter,
          border: glassmorphism.border,
          boxShadow: glassmorphism.boxShadow,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: shadows[5],
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: shape.borderRadiusSmall,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${palette.divider}`,
            '&:hover': {
              border: `1px solid ${palette.primary.main}`,
              backgroundColor: 'rgba(59, 130, 246, 0.02)',
            },
            '&.Mui-focused': {
              border: `2px solid ${palette.primary.main}`,
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.1)`,
            },
          },
          '& .MuiInputLabel-root': {
            color: palette.text.secondary,
            '&.Mui-focused': {
              color: palette.primary.main,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: shape.borderRadiusSmall,
          fontWeight: 500,
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          backdropFilter: 'blur(12px)',
          boxShadow: 'none',
          borderBottom: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: glassmorphism.background,
          backdropFilter: glassmorphism.backdropFilter,
          border: `1px solid ${palette.divider}`,
          borderLeft: 'none',
        },
      },
    },
  },
  mixins: {
    toolbar: {
      minHeight: '72px',
    },
  },
});

export default theme;
export { glassmorphism };
