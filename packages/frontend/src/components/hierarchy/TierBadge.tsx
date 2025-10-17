import React from 'react';
import { Tag, Tooltip } from 'antd';
import {
  CrownOutlined,
  ShopOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';

type TierType = 'administrator' | 'agency' | 'organization' | 'admin' | 'general';

interface TierBadgeProps {
  tier: TierType;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showTooltip?: boolean;
}

const tierConfig = {
  administrator: {
    color: '#f5222d',
    icon: <CrownOutlined />,
    label: 'Administrator',
    description: 'System administrator with full access',
  },
  agency: {
    color: '#722ed1',
    icon: <ShopOutlined />,
    label: 'Agency',
    description: 'Manages multiple organizations',
  },
  organization: {
    color: '#1890ff',
    icon: <BankOutlined />,
    label: 'Organization',
    description: 'Manages admins and general users',
  },
  admin: {
    color: '#52c41a',
    icon: <TeamOutlined />,
    label: 'Admin',
    description: 'Manages general users in organization',
  },
  general: {
    color: '#8c8c8c',
    icon: <UserOutlined />,
    label: 'General',
    description: 'Regular user',
  },
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'medium',
  showIcon = true,
  showTooltip = true,
}) => {
  const config = tierConfig[tier];

  const badge = (
    <Tag
      color={config.color}
      icon={showIcon ? config.icon : undefined}
      style={{
        fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
        padding: size === 'small' ? '2px 8px' : size === 'large' ? '6px 12px' : '4px 10px',
      }}
    >
      {config.label}
    </Tag>
  );

  if (showTooltip) {
    return <Tooltip title={config.description}>{badge}</Tooltip>;
  }

  return badge;
};
