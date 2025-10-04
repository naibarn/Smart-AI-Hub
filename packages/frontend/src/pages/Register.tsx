import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  GlassCard,
  AnimatedInput,
  GradientButton,
  LoadingSpinner,
} from '../components/common';

interface RegisterFormData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Step 2: Company Info
  companyName: string;
  companySize: string;
  industry: string;
  
  // Step 3: Security
  password: string;
  confirmPassword: string;
  
  // Step 4: Verification
  verificationCode: string[];
}

interface FormErrors {
  [key: string]: string;
}

const steps = [
  'Basic Information',
  'Company Details',
  'Security',
  'Verification',
];

const Register: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = React.useState(0);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  
  const [formData, setFormData] = React.useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    companySize: '',
    industry: '',
    password: '',
    confirmPassword: '',
    verificationCode: ['', '', '', '', '', ''],
  });
  
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [passwordStrength, setPasswordStrength] = React.useState(0);

  const handleInputChange = (field: keyof RegisterFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Calculate password strength
    if (field === 'password') {
      const password = event.target.value;
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
      if (/\d/.test(password)) strength += 25;
      if (/[^a-zA-Z\d]/.test(password)) strength += 25;
      setPasswordStrength(strength);
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...formData.verificationCode];
    newCode[index] = value;
    setFormData(prev => ({ ...prev, verificationCode: newCode }));

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`verification-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    // Check if all codes are entered
    if (newCode.every(code => code.length === 1)) {
      handleVerification();
    }
  };

  const handleVerification = () => {
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }, 2000);
  };

  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};

    switch (activeStep) {
      case 0: // Basic Info
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        break;
        
      case 1: // Company Info
        if (!formData.companyName) newErrors.companyName = 'Company name is required';
        if (!formData.companySize) newErrors.companySize = 'Company size is required';
        if (!formData.industry) newErrors.industry = 'Industry is required';
        break;
        
      case 2: // Security
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 3: // Verification
        if (formData.verificationCode.some(code => code.length !== 1)) {
          newErrors.verificationCode = 'Please enter all 6 digits';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (activeStep === 2) {
      // Send verification code
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setActiveStep(prev => prev + 1);
      }, 1500);
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return theme.palette.error.main;
    if (passwordStrength <= 50) return theme.palette.warning.main;
    if (passwordStrength <= 75) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Basic Info
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <AnimatedInput
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  startIcon={<User size={20} />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <AnimatedInput
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                />
              </Grid>
              <Grid item xs={12}>
                <AnimatedInput
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  startIcon={<Mail size={20} />}
                />
              </Grid>
              <Grid item xs={12}>
                <AnimatedInput
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  startIcon={<Phone size={20} />}
                />
              </Grid>
            </Grid>
          </motion.div>
        );

      case 1: // Company Info
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <AnimatedInput
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={handleInputChange('companyName')}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                  startIcon={<Building size={20} />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <AnimatedInput
                  fullWidth
                  label="Company Size"
                  value={formData.companySize}
                  onChange={handleInputChange('companySize')}
                  error={!!errors.companySize}
                  helperText={errors.companySize}
                  placeholder="e.g., 1-10, 11-50, 51-200"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <AnimatedInput
                  fullWidth
                  label="Industry"
                  value={formData.industry}
                  onChange={handleInputChange('industry')}
                  error={!!errors.industry}
                  helperText={errors.industry}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </Grid>
            </Grid>
          </motion.div>
        );

      case 2: // Security
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <AnimatedInput
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  startIcon={<Lock size={20} />}
                  password
                />
                
                {/* Password strength indicator */}
                {formData.password && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                        Password Strength:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: getPasswordStrengthColor(),
                        }}
                      >
                        {getPasswordStrengthText()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength}%` }}
                        transition={{ duration: 0.3 }}
                        style={{
                          height: '100%',
                          backgroundColor: getPasswordStrengthColor(),
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <AnimatedInput
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  startIcon={<Lock size={20} />}
                  password
                />
              </Grid>
            </Grid>
          </motion.div>
        );

      case 3: // Verification
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Verify Your Email
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                We've sent a 6-digit verification code to {formData.email}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
              {formData.verificationCode.map((digit, index) => (
                <TextField
                  key={index}
                  id={`verification-${index}`}
                  value={digit}
                  onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                  variant="outlined"
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      width: '50px',
                      height: '50px',
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              ))}
            </Box>
            
            {isVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center' }}
              >
                <CheckCircle
                  size={60}
                  color={theme.palette.success.main}
                  style={{ marginBottom: 16 }}
                />
                <Typography variant="h6" sx={{ color: theme.palette.success.main }}>
                  Email Verified Successfully!
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Redirecting to your dashboard...
                </Typography>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        p: 2,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <GlassCard glow="primary" sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
              Create Your Account
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, mb: 4, textAlign: 'center' }}
            >
              Join Smart AI Hub and unlock the power of AI
            </Typography>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step Content */}
            <Box sx={{ mb: 4, minHeight: '300px' }}>
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowLeft size={20} />
                  Back
                </Box>
              </Button>

              <GradientButton
                onClick={handleNext}
                variant="primary"
                glow
                disabled={isLoading || isVerified}
              >
                {isLoading ? (
                  <LoadingSpinner size={24} color="inherit" />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
                    <ArrowRight size={20} />
                  </Box>
                )}
              </GradientButton>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Already have an account?{' '}
                <Button
                  onClick={() => navigate('/login')}
                  sx={{
                    color: theme.palette.primary.main,
                    textTransform: 'none',
                    fontWeight: 600,
                    p: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign in
                </Button>
              </Typography>
            </Box>
          </GlassCard>
        </motion.div>
      </Container>

      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <LoadingSpinner 
            overlay 
            text={activeStep === 2 ? 'Sending verification code...' : 'Creating account...'} 
          />
        </Box>
      )}
    </Box>
  );
};

export default Register;