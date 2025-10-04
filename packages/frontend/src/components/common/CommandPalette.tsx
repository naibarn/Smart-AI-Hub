import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search,
  Command,
  LayoutDashboard,
  CreditCard,
  Settings,
  Users,
  FileText,
  Zap,
  Shield,
  LogOut,
  Plus,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'action' | 'settings';
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'View your dashboard and stats',
      icon: <LayoutDashboard size={20} />,
      action: () => {
        navigate('/');
        onClose();
      },
      keywords: ['home', 'overview'],
      category: 'navigation',
    },
    {
      id: 'credits',
      title: 'Credits',
      description: 'Manage your credits and billing',
      icon: <CreditCard size={20} />,
      action: () => {
        navigate('/credits');
        onClose();
      },
      keywords: ['billing', 'payment'],
      category: 'navigation',
    },
    {
      id: 'team',
      title: 'Team',
      description: 'Manage team members',
      icon: <Users size={20} />,
      action: () => {
        navigate('/team');
        onClose();
      },
      keywords: ['members', 'collaborators'],
      category: 'navigation',
    },
    {
      id: 'api-keys',
      title: 'API Keys',
      description: 'Manage your API keys',
      icon: <Shield size={20} />,
      action: () => {
        navigate('/services/api-keys');
        onClose();
      },
      keywords: ['keys', 'tokens'],
      category: 'navigation',
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Account and application settings',
      icon: <Settings size={20} />,
      action: () => {
        navigate('/settings');
        onClose();
      },
      keywords: ['preferences', 'config'],
      category: 'navigation',
    },
    {
      id: 'new-api-key',
      title: 'Create New API Key',
      description: 'Generate a new API key',
      icon: <Plus size={20} />,
      action: () => {
        // Handle creating new API key
        onClose();
      },
      keywords: ['generate', 'create'],
      category: 'action',
    },
    {
      id: 'top-up',
      title: 'Top Up Credits',
      description: 'Add more credits to your account',
      icon: <CreditCard size={20} />,
      action: () => {
        navigate('/credits?topup=true');
        onClose();
      },
      keywords: ['add', 'buy', 'purchase'],
      category: 'action',
    },
    {
      id: 'logout',
      title: 'Logout',
      description: 'Sign out of your account',
      icon: <LogOut size={20} />,
      action: () => {
        // Handle logout
        navigate('/login');
        onClose();
      },
      keywords: ['signout', 'exit'],
      category: 'settings',
    },
  ];

  const filteredCommands = React.useMemo(() => {
    if (!searchQuery) return commands;

    const query = searchQuery.toLowerCase();
    return commands.filter(
      cmd =>
        cmd.title.toLowerCase().indexOf(query) !== -1 ||
        (cmd.description && cmd.description.toLowerCase().indexOf(query) !== -1) ||
        (cmd.keywords && cmd.keywords.some(keyword => keyword.toLowerCase().indexOf(query) !== -1))
    );
  }, [searchQuery]);

  React.useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, filteredCommands, onClose]);

  const getCategoryLabel = (category: CommandItem['category']) => {
    switch (category) {
      case 'navigation':
        return 'Navigation';
      case 'action':
        return 'Actions';
      case 'settings':
        return 'Settings';
      default:
        return '';
    }
  };

  // Group commands by category
  const groupedCommands: Record<string, CommandItem[]> = {};
  filteredCommands.forEach(cmd => {
    const category = getCategoryLabel(cmd.category);
    if (!groupedCommands[category]) {
      groupedCommands[category] = [];
    }
    groupedCommands[category].push(cmd);
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogContent sx={{ p: 0 }}>
              {/* Search Input */}
              <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <TextField
                  inputRef={searchInputRef}
                  fullWidth
                  placeholder="Type a command or search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color={theme.palette.text.secondary} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            ESC
                          </Typography>
                          <IconButton size="small" onClick={onClose}>
                            <X size={18} />
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: '1rem',
                      py: 1,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'transparent',
                      border: 'none',
                      '&:hover': {
                        border: 'none',
                      },
                      '&.Mui-focused': {
                        border: 'none',
                        boxShadow: 'none',
                      },
                    },
                  }}
                />
              </Box>

              {/* Commands List */}
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {Object.keys(groupedCommands).map((category, categoryIndex) => (
                  <Box key={category}>
                    {/* Category Header */}
                    <Box sx={{ px: 3, py: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {category}
                      </Typography>
                    </Box>

                    {/* Commands */}
                    {groupedCommands[category].map((command, index) => {
                      let globalIndex = 0;
                      const categories = Object.keys(groupedCommands);
                      for (let i = 0; i < categoryIndex; i++) {
                        globalIndex += groupedCommands[categories[i]].length;
                      }
                      globalIndex += index;

                      return (
                        <ListItem
                          key={command.id}
                          disablePadding
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                            ...(selectedIndex === globalIndex && {
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            }),
                          }}
                        >
                          <ListItemButton
                            onClick={command.action}
                            sx={{ py: 2 }}
                          >
                            <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
                              {command.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={command.title}
                              secondary={command.description}
                              primaryTypographyProps={{
                                fontWeight: 500,
                                color: theme.palette.text.primary,
                              }}
                              secondaryTypographyProps={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.875rem',
                              }}
                            />
                            <Box sx={{ ml: 2 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  fontSize: '0.75rem',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: '4px',
                                }}
                              >
                                ↵
                              </Typography>
                            </Box>
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </Box>
                ))}

                {filteredCommands.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      No commands found
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default CommandPalette;