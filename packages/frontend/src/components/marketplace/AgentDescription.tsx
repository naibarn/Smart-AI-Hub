import React, { useState } from 'react';
import { Typography, Card, Button, Space } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface AgentDescriptionProps {
  description?: string;
  maxLength?: number;
  showExpand?: boolean;
  loading?: boolean;
}

const AgentDescription: React.FC<AgentDescriptionProps> = ({
  description,
  maxLength = 300,
  showExpand = true,
  loading = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!description) {
    return null;
  }

  const shouldTruncate = showExpand && description.length > maxLength;
  const displayText = shouldTruncate && !expanded 
    ? description.substring(0, maxLength) + '...' 
    : description;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Basic XSS protection - remove script tags and dangerous attributes
  const sanitizeHTML = (html: string) => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');
  };

  // Check if description contains HTML tags
  const hasHTML = /<[^>]+>/.test(description);

  const renderContent = () => {
    if (hasHTML) {
      // For HTML content, we'll render it as plain text for now
      // In a real implementation, you might want to use a library like DOMPurify
      const cleanHTML = sanitizeHTML(displayText);
      return (
        <div
          dangerouslySetInnerHTML={{ __html: cleanHTML }}
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#333',
          }}
        />
      );
    }

    return (
      <Paragraph
        style={{
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#333',
          marginBottom: 0,
        }}
      >
        {displayText}
      </Paragraph>
    );
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          Description
        </Title>
      }
      style={{ marginBottom: '24px' }}
      bodyStyle={{ padding: '20px' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading description...
        </div>
      ) : (
        <div>
          {renderContent()}
          
          {shouldTruncate && (
            <div style={{ marginTop: '16px' }}>
              <Button
                type="link"
                icon={expanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={toggleExpanded}
                style={{ padding: 0, height: 'auto' }}
              >
                {expanded ? 'Show less' : 'Show more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default AgentDescription;