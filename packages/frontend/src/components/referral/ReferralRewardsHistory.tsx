import React from 'react';
import { Timeline, Card, Typography, Space, Empty, Tag } from 'antd';
import { TrophyOutlined, GiftOutlined } from '@ant-design/icons';
import { TierBadge } from '../hierarchy/TierBadge';

const { Title, Text } = Typography;

interface RewardHistoryItem {
  id: string;
  amount: number;
  date: string;
  referredUserName: string;
  referredUserTier: string;
}

interface ReferralRewardsHistoryProps {
  rewards: RewardHistoryItem[];
  totalRewards: number;
}

export const ReferralRewardsHistory: React.FC<ReferralRewardsHistoryProps> = ({
  rewards,
  totalRewards,
}) => {
  const getTierColor = (tier: string) => {
    const tierColors: Record<string, string> = {
      agency: '#722ed1',
      organization: '#1890ff',
      admin: '#52c41a',
      general: '#8c8c8c',
      administrator: '#f5222d',
    };
    return tierColors[tier] || '#8c8c8c';
  };

  const formatDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (rewards.length === 0) {
    return (
      <Card
        title={
          <>
            <TrophyOutlined /> Rewards History
          </>
        }
      >
        <Empty description="No rewards earned yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined />
          <span>Rewards History</span>
          <Tag color="gold">{totalRewards.toLocaleString()} Total Points</Tag>
        </Space>
      }
    >
      <Timeline
        mode="left"
        items={rewards.map((reward) => ({
          dot: <GiftOutlined style={{ color: getTierColor(reward.referredUserTier) }} />,
          children: (
            <div key={reward.id}>
              <Space direction="vertical" size="small">
                <div>
                  <Text strong style={{ color: getTierColor(reward.referredUserTier) }}>
                    +{reward.amount.toLocaleString()} Points
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatDateString(reward.date)}
                  </Text>
                </div>
                <div>
                  <Text>From: {reward.referredUserName}</Text>
                  <div style={{ marginTop: 4 }}>
                    <TierBadge
                      tier={reward.referredUserTier as any}
                      size="small"
                      showTooltip={false}
                    />
                  </div>
                </div>
              </Space>
            </div>
          ),
        }))}
      />
    </Card>
  );
};
