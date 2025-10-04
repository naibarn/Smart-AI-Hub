import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import theme from './theme/theme';
import { ToastProvider } from './components/common';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TestConnection from './pages/TestConnection';
import NavBar from './components/common/NavBar';
import Sidebar from './components/common/Sidebar';
import CommandPalette from './components/common/CommandPalette';
import PageTransition from './components/common/PageTransition';

// Redux store setup
interface AppState {
  auth: {
    isAuthenticated: boolean;
    user: {
      name: string;
      email: string;
      avatar?: string;
    } | null;
  };
  ui: {
    sidebarOpen: boolean;
    commandPaletteOpen: boolean;
  };
}

const initialState: AppState = {
  auth: {
    isAuthenticated: false,
    user: null,
  },
  ui: {
    sidebarOpen: true,
    commandPaletteOpen: false,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    login: (state, action) => {
      state.auth.isAuthenticated = true;
      state.auth.user = action.payload;
    },
    logout: (state) => {
      state.auth.isAuthenticated = false;
      state.auth.user = null;
    },
    toggleSidebar: (state) => {
      state.ui.sidebarOpen = !state.ui.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.ui.sidebarOpen = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.ui.commandPaletteOpen = !state.ui.commandPaletteOpen;
    },
    setCommandPaletteOpen: (state, action) => {
      state.ui.commandPaletteOpen = action.payload;
    },
  },
});

export const { login, logout, toggleSidebar, setSidebarOpen, toggleCommandPalette, setCommandPaletteOpen } = appSlice.actions;

const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

// Main App component
const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: { app: AppState }) => state.app.auth);
  const { sidebarOpen, commandPaletteOpen } = useSelector((state: { app: AppState }) => state.app.ui);

  React.useEffect(() => {
    // Check for authentication on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch(login(user));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [dispatch]);

  React.useEffect(() => {
    // Global keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open command palette
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        dispatch(toggleCommandPalette());
      }
      
      // Escape to close command palette
      if (event.key === 'Escape' && commandPaletteOpen) {
        dispatch(setCommandPaletteOpen(false));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, commandPaletteOpen]);

  const handleLogin = (userData: { name: string; email: string; avatar?: string }) => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(userData));
    dispatch(login(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <NavBar
          user={user || undefined}
          onMenuToggle={() => dispatch(toggleSidebar())}
          showMenuButton={true}
          transparent={true}
        />
        
        <Sidebar
          open={sidebarOpen}
          onClose={() => dispatch(setSidebarOpen(false))}
          variant="persistent"
          collapsed={false}
          onToggleCollapse={() => dispatch(toggleSidebar())}
        />
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${sidebarOpen ? 280 : 80}px)` },
            ml: { sm: sidebarOpen ? '280px' : '80px' },
            transition: 'width 0.3s ease, margin 0.3s ease',
          }}
        >
          <PageTransition>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/credits" element={<Dashboard />} />
              <Route path="/team" element={<Dashboard />} />
              <Route path="/services/*" element={<Dashboard />} />
              <Route path="/settings" element={<Dashboard />} />
              <Route path="/test-connection" element={<TestConnection />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </Box>
      </Box>
      
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => dispatch(setCommandPaletteOpen(false))}
      />
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
