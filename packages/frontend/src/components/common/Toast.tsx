import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snackbar, Alert, AlertTitle, AlertProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  open: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  onClose?: () => void;
  action?: React.ReactNode;
}

const Toast: React.FC<ToastProps> = ({
  open,
  message,
  type = 'info',
  title,
  duration = 6000,
  position = 'top-right',
  onClose,
  action,
}) => {
  const theme = useTheme();

  const getAnchorOrigin = () => {
    switch (position) {
      case 'top-left':
        return { vertical: 'top' as const, horizontal: 'left' as const };
      case 'top-right':
        return { vertical: 'top' as const, horizontal: 'right' as const };
      case 'bottom-left':
        return { vertical: 'bottom' as const, horizontal: 'left' as const };
      case 'bottom-right':
        return { vertical: 'bottom' as const, horizontal: 'right' as const };
      case 'top-center':
        return { vertical: 'top' as const, horizontal: 'center' as const };
      case 'bottom-center':
        return { vertical: 'bottom' as const, horizontal: 'center' as const };
      default:
        return { vertical: 'top' as const, horizontal: 'right' as const };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getAlertColor = (): AlertProps['severity'] => {
    return type as AlertProps['severity'];
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose?.();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={getAnchorOrigin()}
      sx={{
        '& .MuiSnackbar-root': {
          zIndex: 9999,
        },
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            <Alert
              severity={getAlertColor()}
              icon={getIcon()}
              action={
                <>
                  {action}
                  {onClose && (
                    <button
                      onClick={handleClose}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: '4px',
                        marginLeft: '8px',
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </>
              }
              sx={{
                width: '100%',
                minWidth: '300px',
                maxWidth: '500px',
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 16px rgba(0, 0, 0, 0.08)',
                '& .MuiAlert-icon': {
                  fontSize: '20px',
                },
                '& .MuiAlert-message': {
                  width: '100%',
                },
                '& .MuiAlert-action': {
                  alignItems: 'flex-start',
                },
              }}
            >
              {title && <AlertTitle>{title}</AlertTitle>}
              {message}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </Snackbar>
  );
};

// Toast context for easy usage throughout the app
interface ToastContextType {
  showToast: (props: Omit<ToastProps, 'open' | 'onClose'>) => void;
  hideToast: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = React.useState<Omit<ToastProps, 'open' | 'onClose'>>({
    message: '',
    type: 'info',
  });
  const [open, setOpen] = React.useState(false);

  const showToast = React.useCallback((props: Omit<ToastProps, 'open' | 'onClose'>) => {
    setToast(props);
    setOpen(true);
  }, []);

  const hideToast = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        open={open}
        onClose={hideToast}
        {...toast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;