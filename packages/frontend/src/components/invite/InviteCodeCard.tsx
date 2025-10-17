import React from 'react';
import { Card, Typography, Button, Space, message, Input } from 'antd';
import { CopyOutlined, ReloadOutlined, LinkOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface InviteCodeCardProps {
  code: string;
  link: string;
  onRegenerate?: () => void;
  loading?: boolean;
}

export const InviteCodeCard: React.FC<InviteCodeCardProps> = ({
  code,
  link,
  onRegenerate,
  loading = false
}) => {
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${type} copied to clipboard!`);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        message.success(`${type} copied to clipboard!`);
      } catch (err) {
        message.error('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleRegenerateCode = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  return (
    <Card title="Your Invite Code" loading={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text type="secondary">Invite Code</Text>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Input
              value={code}
              readOnly
              size="large"
              style={{ 
                textAlign: 'center', 
                fontSize: '24px', 
                fontWeight: 'bold',
                letterSpacing: '2px',
                fontFamily: 'monospace'
              }}
              addonAfter={
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(code, 'Code')}
                  type="primary"
                >
                  Copy
                </Button>
              }
            />
          </div>
        </div>
        
        <div>
          <Text type="secondary">Invite Link</Text>
          <div style={{ marginTop: 8 }}>
            <Input
              value={link}
              readOnly
              addonBefore={<LinkOutlined />}
              addonAfter={
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(link, 'Link')}
                  type="primary"
                >
                  Copy
                </Button>
              }
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>
        
        {onRegenerate && (
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRegenerateCode}
            block
            danger
            loading={loading}
          >
            Regenerate Code
          </Button>
        )}
        
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f6f8fa', 
          borderRadius: '6px',
          border: '1px solid #e1e4e8'
        }}>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            Share this code or link with friends to invite them to Smart AI Hub. 
            They can enter the code during registration or use the direct link.
          </Text>
        </div>
      </Space>
    </Card>
  );
};