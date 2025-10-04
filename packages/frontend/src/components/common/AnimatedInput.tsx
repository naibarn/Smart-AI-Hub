import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextField, TextFieldProps, InputAdornment, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface AnimatedInputProps extends Omit<TextFieldProps, 'variant'> {
  label: string;
  error?: boolean;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  floatingLabel?: boolean;
  password?: boolean;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error = false,
  helperText,
  startIcon,
  endIcon,
  floatingLabel = true,
  password = false,
  value,
  onChange,
  ...props
}) => {
  const theme = useTheme();
  const [focused, setFocused] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  React.useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    props.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputProps = {
    startAdornment: startIcon && (
      <InputAdornment position="start">
        <motion.div
          animate={{ scale: focused ? 1.1 : 1, color: focused ? theme.palette.primary.main : theme.palette.text.secondary }}
          transition={{ duration: 0.2 }}
        >
          {startIcon}
        </motion.div>
      </InputAdornment>
    ),
    endAdornment: password ? (
      <InputAdornment position="end">
        <IconButton
          onClick={togglePasswordVisibility}
          edge="end"
          sx={{ color: theme.palette.text.secondary }}
        >
          <motion.div
            animate={{ rotate: showPassword ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </motion.div>
        </IconButton>
      </InputAdornment>
    ) : endIcon ? (
      <InputAdornment position="end">
        <motion.div
          animate={{ scale: focused ? 1.1 : 1, color: focused ? theme.palette.primary.main : theme.palette.text.secondary }}
          transition={{ duration: 0.2 }}
        >
          {endIcon}
        </motion.div>
      </InputAdornment>
    ) : undefined,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <TextField
        {...props}
        value={value}
        onChange={onChange}
        variant="outlined"
        fullWidth
        type={password && !showPassword ? 'password' : 'text'}
        label={floatingLabel ? label : undefined}
        placeholder={floatingLabel ? undefined : label}
        error={error}
        helperText={helperText}
        InputProps={inputProps}
        onFocus={handleFocus}
        onBlur={handleBlur}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              border: `1px solid ${error ? theme.palette.error.main : theme.palette.primary.main}`,
              backgroundColor: error ? 'rgba(239, 68, 68, 0.02)' : 'rgba(59, 130, 246, 0.02)',
            },
            '&.Mui-focused': {
              border: `2px solid ${error ? theme.palette.error.main : theme.palette.primary.main}`,
              backgroundColor: error ? 'rgba(239, 68, 68, 0.05)' : 'rgba(59, 130, 246, 0.05)',
              boxShadow: `0 0 0 3px ${error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`,
            },
          },
          '& .MuiInputLabel-root': {
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            fontWeight: 500,
            '&.Mui-focused': {
              color: error ? theme.palette.error.main : theme.palette.primary.main,
            },
          },
          '& .MuiInputBase-input': {
            color: theme.palette.text.primary,
            fontSize: '1rem',
            padding: '16px',
            '&::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 0.7,
            },
          },
          ...props.sx,
        }}
      />
      <AnimatePresence>
        {error && helperText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: theme.palette.error.main, fontSize: '0.75rem', marginTop: '4px', marginLeft: '14px' }}
          >
            {helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedInput;