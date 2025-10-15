import * as React from 'react';
import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import WebhookList from '../components/webhooks/WebhookList';
import WebhookForm from '../components/webhooks/WebhookForm';
import WebhookLogs from '../components/webhooks/WebhookLogs';
import { WebhookEndpoint } from '../services/webhook.service';

type View = 'list' | 'create' | 'edit' | 'logs';

const Webhooks: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);

  const handleCreateNew = () => {
    setSelectedWebhook(null);
    setCurrentView('create');
  };

  const handleEdit = (webhook: WebhookEndpoint) => {
    setSelectedWebhook(webhook);
    setCurrentView('edit');
  };

  const handleViewLogs = (webhook: WebhookEndpoint) => {
    setSelectedWebhook(webhook);
    setCurrentView('logs');
  };

  const handleSave = (webhook: WebhookEndpoint) => {
    setSelectedWebhook(null);
    setCurrentView('list');
  };

  const handleCancel = () => {
    setSelectedWebhook(null);
    setCurrentView('list');
  };

  const handleCloseLogs = () => {
    setSelectedWebhook(null);
    setCurrentView('list');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WebhookForm
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </motion.div>
        );
      
      case 'edit':
        return (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedWebhook && (
              <WebhookForm
                webhook={selectedWebhook}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}
          </motion.div>
        );
      
      case 'logs':
        return (
          <motion.div
            key="logs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedWebhook && (
              <WebhookLogs
                webhook={selectedWebhook}
                onClose={handleCloseLogs}
              />
            )}
          </motion.div>
        );
      
      case 'list':
      default:
        return (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WebhookList
              onEdit={handleEdit}
              onViewLogs={handleViewLogs}
              onCreateNew={handleCreateNew}
            />
          </motion.div>
        );
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', p: 3 }}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </Box>
  );
};

export default Webhooks;