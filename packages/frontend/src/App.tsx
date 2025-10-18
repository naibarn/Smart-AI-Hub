import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme/theme';
import { ToastProvider } from './components/common';
import { ProtectedRoute, AdminProtectedRoute } from './components/auth';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import EmailVerification from './pages/EmailVerification';
import OAuthSuccess from './pages/OAuthSuccess';
import Dashboard from './pages/Dashboard';
import TestConnection from './pages/TestConnection';
import ChatInterface from './pages/ChatInterface';
import Billing from './pages/Billing';
import Points from './pages/Points';
import Webhooks from './pages/Webhooks';
import { Referrals } from './pages/Referrals';
import { Invite } from './pages/Invite';
import { AgencySettings } from './pages/agency/AgencySettings';
import {
  MonitoringDashboard,
  PerformanceMonitoring,
  DatabaseMonitoring,
  AlertsMonitoring,
  SystemMonitoring,
  GrafanaDashboards,
} from './pages/admin/monitoring/index-pages';
import CommandPalette from './components/common/CommandPalette';
import { api } from './services/api';
import RAGSystem from './pages/RAGSystem';
import PricingSystem from './pages/PricingSystem';
import AgentSkillsMarketplace from './pages/AgentSkillsMarketplace';

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

export const {
  login,
  logout,
  toggleSidebar,
  setSidebarOpen,
  toggleCommandPalette,
  setCommandPaletteOpen,
} = appSlice.actions;

const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

// Main App component
const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: { app: AppState }) => state.app.auth);
  const { sidebarOpen, commandPaletteOpen } = useSelector(
    (state: { app: AppState }) => state.app.ui
  );

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

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/auth/success" element={<OAuthSuccess />} />
        <Route path="/auth/error" element={<OAuthSuccess />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout user={user || undefined} sidebarOpen={sidebarOpen} />}>
            <Route index element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/credits" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/points" element={<Points />} />
            <Route path="/team" element={<Dashboard />} />
            <Route path="/services/*" element={<Dashboard />} />
            <Route path="/settings" element={<Dashboard />} />
            <Route path="/webhooks" element={<Webhooks />} />
            <Route path="/test-connection" element={<TestConnection />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/agency/settings" element={<AgencySettings />} />
            <Route path="/rag-system" element={<RAGSystem />} />
            <Route path="/pricing-system" element={<PricingSystem />} />
            <Route path="/skills-marketplace" element={<AgentSkillsMarketplace />} />

            {/* Admin monitoring routes with RBAC protection */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin/monitoring" element={<MonitoringDashboard />} />
              <Route path="/admin/monitoring/performance" element={<PerformanceMonitoring />} />
              <Route path="/admin/monitoring/database" element={<DatabaseMonitoring />} />
              <Route path="/admin/monitoring/alerts" element={<AlertsMonitoring />} />
              <Route path="/admin/monitoring/system" element={<SystemMonitoring />} />
              <Route path="/admin/monitoring/grafana" element={<GrafanaDashboards />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

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
