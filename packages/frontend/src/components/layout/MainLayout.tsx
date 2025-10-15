import React from 'react';
import { Box } from '@mui/material';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import NavBar from '../common/NavBar';
import Sidebar from '../common/Sidebar';
import PageTransition from '../common/PageTransition';
import { toggleSidebar, setSidebarOpen } from '../../App';

interface MainLayoutProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  sidebarOpen: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ user, sidebarOpen }) => {
  const dispatch = useDispatch();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <NavBar
        user={user}
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
          <Outlet />
        </PageTransition>
      </Box>
    </Box>
  );
};

export default MainLayout;
