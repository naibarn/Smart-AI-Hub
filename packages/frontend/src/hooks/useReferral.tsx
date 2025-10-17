import { useState, useEffect } from 'react';
import { message } from 'antd';

interface ReferralData {
  inviteCode: string;
  inviteLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
}

interface ReferralListResponse {
  id: string;
  name: string;
  email: string;
  tier: string;
  signupDate: string;
  status: 'active' | 'blocked';
  reward: number;
}

interface ReferralRewardResponse {
  id: string;
  amount: number;
  date: string;
  referredUserName: string;
  referredUserTier: string;
}

interface ReferralChartData {
  date: string;
  count: number;
}

interface ReferralStatsResponse {
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  chartData: ReferralChartData[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useReferral = () => {
  const [data, setData] = useState<ReferralData | null>(null);
  const [referralList, setReferralList] = useState<ReferralListResponse[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<ReferralRewardResponse[]>([]);
  const [stats, setStats] = useState<ReferralStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/referral/invite-code`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const inviteCode = result.data.inviteCode;
        const inviteLink = `${window.location.origin}/register?invite=${inviteCode}`;

        setData({
          inviteCode,
          inviteLink,
          totalReferrals: 0,
          activeReferrals: 0,
          totalRewards: 0,
        });
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/referral/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);

        // Update the main data with stats
        setData((prev) =>
          prev
            ? {
                ...prev,
                totalReferrals: result.data.totalReferrals,
                activeReferrals: result.data.activeReferrals,
                totalRewards: result.data.totalRewards,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to fetch referral stats:', err);
    }
  };

  const fetchReferralList = async (page = 1, pageSize = 20) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/referral/list?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setReferralList(result.data.referrals || []);
      }
    } catch (err) {
      console.error('Failed to fetch referral list:', err);
    }
  };

  const fetchRewardsHistory = async (page = 1, pageSize = 20) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/referral/rewards?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setRewardsHistory(result.data.rewards || []);
      }
    } catch (err) {
      console.error('Failed to fetch rewards history:', err);
    }
  };

  const regenerateInviteCode = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/referral/regenerate-code`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const newInviteCode = result.data.inviteCode;
        const newInviteLink = `${window.location.origin}/register?invite=${newInviteCode}`;

        setData((prev) =>
          prev
            ? {
                ...prev,
                inviteCode: newInviteCode,
                inviteLink: newInviteLink,
              }
            : null
        );

        message.success('Invite code regenerated successfully!');
      }
    } catch (err) {
      console.error('Failed to regenerate invite code:', err);
      message.error('Failed to regenerate invite code');
    }
  };

  useEffect(() => {
    fetchReferralData();
    fetchReferralStats();
    fetchReferralList();
    fetchRewardsHistory();
  }, []);

  return {
    data,
    referralList,
    rewardsHistory,
    stats,
    loading,
    error,
    refetch: fetchReferralData,
    refetchStats: fetchReferralStats,
    refetchList: fetchReferralList,
    refetchRewards: fetchRewardsHistory,
    regenerateCode: regenerateInviteCode,
  };
};
