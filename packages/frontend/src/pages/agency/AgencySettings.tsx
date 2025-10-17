import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Alert } from 'antd';
import { RouteGuard } from '../../components/guards/RouteGuard';
import { AgencyRewardSettings } from '../../components/agency/AgencyRewardSettings';
import { RewardStatistics } from '../../components/agency/RewardStatistics';
import { SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface RewardSettings {
  organizationSignupReward: number;
  adminSignupReward: number;
  generalSignupReward: number;
}

interface RewardStatisticsData {
  totalRewardsGiven: number;
  organizationSignups: number;
  organizationRewards: number;
  adminSignups: number;
  adminRewards: number;
  generalSignups: number;
  generalRewards: number;
  chartData: Array<{
    tier: string;
    signups: number;
    rewards: number;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AgencySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settings, setSettings] = useState<RewardSettings | null>(null);
  const [statistics, setStatistics] = useState<RewardStatisticsData | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchStatistics();
    fetchBalance();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/agency/referral-config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load agency settings');
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/agency/reward-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/agency/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setCurrentBalance(result.data.balance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const handleSaveSettings = async (newSettings: RewardSettings) => {
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/agency/referral-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setSettings(newSettings);
        message.success('Settings saved successfully!');
        // Refresh balance after saving
        fetchBalance();
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to save settings');
      throw err;
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Agency Settings</Title>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading agency settings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Agency Settings</Title>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      </div>
    );
  }

  return (
    <RouteGuard allowedTiers={['agency']}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <SettingOutlined style={{ fontSize: '24px', marginRight: '12px' }} />
          <Title level={2} style={{ margin: 0 }}>Agency Settings</Title>
        </div>

        {currentBalance < 1000 && (
          <Alert
            message="Low Balance Warning"
            description={`Your current balance is ${currentBalance.toLocaleString()} points. Consider adding more points to ensure you can pay out referral rewards.`}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {statistics && (
          <RewardStatistics statistics={statistics} />
        )}

        {settings && (
          <AgencyRewardSettings
            settings={settings}
            onSave={handleSaveSettings}
            currentBalance={currentBalance}
            loading={settingsLoading}
          />
        )}

        <Alert
          message="Important Information"
          description={
            <div>
              <p>• Reward amounts will be deducted from your agency balance when users sign up using your invite codes.</p>
              <p>• You must maintain sufficient balance to cover all reward payouts.</p>
              <p>• Changes to reward settings will only apply to new signups after the changes are saved.</p>
              <p>• You can view all referral activity and reward payments in the Referrals section.</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />
      </div>
    </RouteGuard>
  );
};