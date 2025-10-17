import React from 'react';
import { Card, Avatar, Tag, Button, Typography, Space, Tooltip } from 'antd';
import { EyeOutlined, StarOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Paragraph } = Typography;
const { Meta } = Card;

interface AgentCardProps {
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
    };
    createdAt: string;
    metadata?: any;
  };
  loading?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, loading = false }) => {
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

  const handleCardClick = () => {
    navigate(`/marketplace/${agent.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      loading={loading}
      hoverable
      className="agent-card"
      style={{
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
      bodyStyle={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      cover={
        agent.icon ? (
          <div
            style={{
              height: '160px',
              background: `url(${agent.icon}) center/cover`,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
              }}
            >
              <Tag color={getTypeColor(agent.type)}>{getTypeLabel(agent.type)}</Tag>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: '160px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Avatar
              size={64}
              icon={<UserOutlined />}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
              }}
            >
              <Tag color={getTypeColor(agent.type)}>{getTypeLabel(agent.type)}</Tag>
            </div>
          </div>
        )
      }
      actions={[
        <Tooltip title="View details">
          <Button type="text" icon={<EyeOutlined />} onClick={handleCardClick}>
            View
          </Button>
        </Tooltip>,
        <Tooltip title="Add to favorites">
          <Button
            type="text"
            icon={<StarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement favorite functionality
            }}
          />
        </Tooltip>,
      ]}
      onClick={handleCardClick}
    >
      <Meta
        title={
          <div style={{ marginBottom: '8px' }}>
            <Text strong style={{ fontSize: '16px', lineHeight: '1.4' }}>
              {agent.name}
            </Text>
          </div>
        }
        description={
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Paragraph
              ellipsis={{ rows: 2, expandable: false }}
              style={{
                margin: 0,
                fontSize: '14px',
                color: '#666',
                minHeight: '40px',
              }}
            >
              {agent.description}
            </Paragraph>

            <Space size="small" wrap>
              {agent.category && (
                <Tag color="cyan" style={{ fontSize: '12px' }}>
                  {agent.category}
                </Tag>
              )}
              {agent.metadata?.tags?.slice(0, 2).map((tag: string, index: number) => (
                <Tag key={index} style={{ fontSize: '12px' }}>
                  {tag}
                </Tag>
              ))}
            </Space>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto',
                paddingTop: '8px',
                borderTop: '1px solid #f0f0f0',
              }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  by {agent.creator.displayName}
                </Text>
              </div>
              <div>
                <Space size="small">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <EyeOutlined /> {agent.usageCount}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatDate(agent.createdAt)}
                  </Text>
                </Space>
              </div>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default AgentCard;
