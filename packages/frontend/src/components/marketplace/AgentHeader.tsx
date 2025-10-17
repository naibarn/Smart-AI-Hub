import React from 'react';
import { Avatar, Tag, Space, Typography, Button, Divider } from 'antd';
import { UserOutlined, StarOutlined, ShareAltOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface AgentHeaderProps {
  agent: {
    id: string;
    name: string;
    description: string;
    category?: string;
    icon?: string;
    type: 'AGENTFLOW' | 'CUSTOMGPT' | 'GEMINI_GEM';
    usageCount: number;
    creator: {
      displayName: string;
      profile?: {
        firstName?: string;
        lastName?: string;
        avatarUrl?: string;
      };
    };
    createdAt: string;
    updatedAt: string;
    metadata?: any;
  };
  loading?: boolean;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({ agent, loading = false }) => {
  const navigate = useNavigate();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AGENTFLOW':
        return 'blue';
      case 'CUSTOMGPT':
        return 'green';
      case 'GEMINI_GEM':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'AGENTFLOW':
        return 'Agent Flow';
      case 'CUSTOMGPT':
        return 'Custom GPT';
      case 'GEMINI_GEM':
        return 'Gemini Gem';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: agent.name,
        text: agent.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show notification
    }
  };

  const handleFavorite = () => {
    // TODO: Implement favorite functionality
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <Button
          type="link"
          onClick={() => navigate('/marketplace')}
          style={{ padding: 0, height: 'auto' }}
        >
          ← Back to Marketplace
        </Button>
      </div>

      {/* Main Header */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Agent Icon */}
        <div style={{ flexShrink: 0 }}>
          {agent.icon ? (
            <Avatar size={120} src={agent.icon} style={{ border: '2px solid #f0f0f0' }} />
          ) : (
            <Avatar
              size={120}
              icon={<UserOutlined />}
              style={{
                backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: '2px solid #f0f0f0',
              }}
            />
          )}
        </div>

        {/* Agent Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title level={2} style={{ marginBottom: '8px', lineHeight: '1.2' }}>
                {agent.name}
              </Title>

              <Space wrap size="small" style={{ marginBottom: '12px' }}>
                <Tag color={getTypeColor(agent.type)}>{getTypeLabel(agent.type)}</Tag>
                {agent.category && <Tag color="cyan">{agent.category}</Tag>}
                {agent.metadata?.tags?.slice(0, 3).map((tag: string, index: number) => (
                  <Tag key={index} style={{ fontSize: '12px' }}>
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>

            {/* Action Buttons */}
            <Space>
              <Button
                icon={<StarOutlined />}
                onClick={handleFavorite}
                style={{ borderRadius: '6px' }}
              >
                Favorite
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                style={{ borderRadius: '6px' }}
              >
                Share
              </Button>
            </Space>
          </div>

          {/* Description */}
          <Paragraph
            style={{
              fontSize: '16px',
              color: '#333',
              marginBottom: '16px',
              lineHeight: '1.6',
            }}
          >
            {agent.description}
          </Paragraph>

          {/* Meta Information */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
            <Space>
              <Avatar size="small" src={agent.creator.profile?.avatarUrl} icon={<UserOutlined />} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{agent.creator.displayName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>Creator</div>
              </div>
            </Space>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                <EyeOutlined /> {agent.usageCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Uses</div>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatDate(agent.createdAt)}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Created</div>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{formatDate(agent.updatedAt)}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Updated</div>
            </div>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '24px 0' }} />
    </div>
  );
};

export default AgentHeader;
