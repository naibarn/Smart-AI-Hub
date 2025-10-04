import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  FileText,
  BarChart3,
  Users,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: SidebarItem[];
  badge?: string | number;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'temporary' | 'persistent' | 'permanent';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/',
  },
  {
    id: 'credits',
    label: 'Credits',
    icon: <CreditCard size={20} />,
    path: '/credits',
    badge: 'New',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 size={20} />,
    path: '/analytics',
  },
  {
    id: 'services',
    label: 'Services',
    icon: <Zap size={20} />,
    children: [
      {
        id: 'ai-models',
        label: 'AI Models',
        icon: <Zap size={16} />,
        path: '/services/ai-models',
      },
      {
        id: 'api-keys',
        label: 'API Keys',
        icon: <Shield size={16} />,
        path: '/services/api-keys',
      },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users size={20} />,
    path: '/team',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <FileText size={20} />,
    path: '/billing',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={20} />,
    path: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  variant = 'temporary',
  collapsed = false,
  onToggleCollapse,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['services']);

  const handleItemClick = (item: SidebarItem) => {
    if (item.path) {
      navigate(item.path);
      if (variant === 'temporary') {
        onClose();
      }
    } else if (item.children) {
      setExpandedItems(prev =>
        prev.indexOf(item.id) !== -1
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    }
  };

  const isItemActive = (item: SidebarItem): boolean => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some(child => child.path === location.pathname);
    }
    return false;
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.indexOf(item.id) !== -1;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <Box key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              minHeight: '48px',
              px: collapsed ? 2 : 2.5,
              mx: 1,
              my: 0.5,
              borderRadius: '8px',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? 'auto' : '40px',
                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.badge && (
                    <Box
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      {item.badge}
                    </Box>
                  )}
                  {hasChildren && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  )}
                </Box>
              </>
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderSidebarItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Smart AI Hub
            </Typography>
          </motion.div>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {variant === 'persistent' && onToggleCollapse && (
            <IconButton
              onClick={onToggleCollapse}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <motion.div
                animate={{ rotate: collapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown size={20} />
              </motion.div>
            </IconButton>
          )}
          {variant === 'temporary' && (
            <IconButton
              onClick={onClose}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <X size={20} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, py: 2 }}>
        <List>
          {sidebarItems.map(item => renderSidebarItem(item))}
        </List>
      </Box>

      {/* Footer */}
      {!collapsed && (
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              display: 'block',
            }}
          >
            © 2024 Smart AI Hub
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <AnimatePresence>
      {(open || variant === 'permanent') && (
        <motion.div
          initial={variant === 'temporary' ? { x: -300 } : {}}
          animate={{ x: 0 }}
          exit={variant === 'temporary' ? { x: -300 } : {}}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Drawer
            variant={variant}
            open={open}
            onClose={onClose}
            sx={{
              '& .MuiDrawer-paper': {
                width: collapsed ? 80 : 280,
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: 'none',
                boxSizing: 'border-box',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;