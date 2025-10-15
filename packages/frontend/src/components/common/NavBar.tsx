import * as React from 'react';
import { motion } from 'framer-motion';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Settings,
  LogOut,
  User,
  CreditCard,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavBarProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  transparent?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({
  title = 'Smart AI Hub',
  user,
  onMenuToggle,
  showMenuButton = true,
  transparent = true,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = React.useState(true);

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, this would update the theme context
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    // In a real app, this would handle logout logic
    navigate('/login');
  };

  const getAppBarStyle = () => {
    if (transparent) {
      return {
        backgroundColor: scrolled ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.1)' : 'none',
        borderBottom: scrolled ? `1px solid ${theme.palette.divider}` : 'none',
        transition: 'all 0.3s ease-in-out',
      };
    }
    return {
      backgroundColor: theme.palette.background.paper,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      borderBottom: `1px solid ${theme.palette.divider}`,
    };
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          ...getAppBarStyle(),
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: '72px' }}>
          {showMenuButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuToggle}
              sx={{
                mr: 2,
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <MenuIcon size={24} />
            </IconButton>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ flexGrow: 1 }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              {title}
            </Typography>
          </motion.div>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                color="inherit"
                onClick={handleToggleDarkMode}
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </IconButton>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton
                color="inherit"
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Bell size={20} />
              </IconButton>
            </motion.div>

            {user ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleProfileMenuOpen}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.text.primary,
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: `1px solid ${theme.palette.primary.main}`,
                      },
                    }}
                  >
                    <Avatar src={user.avatar} alt={user.name} sx={{ width: 32, height: 32 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.name}
                    </Typography>
                  </Button>
                </motion.div>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleProfileMenuClose}
                  onClick={handleProfileMenuClose}
                  PaperProps={{
                    sx: {
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '12px',
                      mt: 1,
                      minWidth: '200px',
                    },
                  }}
                >
                  <MenuItem onClick={() => navigate('/profile')}>
                    <ListItemIcon>
                      <User size={20} color={theme.palette.text.secondary} />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/credits')}>
                    <ListItemIcon>
                      <CreditCard size={20} color={theme.palette.text.secondary} />
                    </ListItemIcon>
                    <ListItemText primary="Credits" />
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/settings')}>
                    <ListItemIcon>
                      <Settings size={20} color={theme.palette.text.secondary} />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogOut size={20} color={theme.palette.error.main} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" sx={{ color: theme.palette.error.main }} />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: '#FFFFFF',
                    fontWeight: 600,
                    padding: '8px 24px',
                    borderRadius: '8px',
                    textTransform: 'none',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                    },
                  }}
                >
                  Login
                </Button>
              </motion.div>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar sx={{ minHeight: '72px' }} />
    </>
  );
};

export default NavBar;
