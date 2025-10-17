import React from 'react';
import { Card, Button, Space, message as antdMessage } from 'antd';
import {
  FacebookOutlined,
  TwitterOutlined,
  MailOutlined,
  WhatsAppOutlined,
  LinkOutlined
} from '@ant-design/icons';

interface SocialShareButtonsProps {
  link: string;
  message?: string;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  link,
  message = 'Join Smart AI Hub using my invite link!'
}) => {
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLine = () => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = 'Join Smart AI Hub';
    const body = `${message}\n\n${link}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message + ' ' + link)}`;
    window.open(url, '_blank');
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      antdMessage.success('Link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        antdMessage.success('Link copied to clipboard!');
      } catch (err) {
        antdMessage.error('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Card title="Share Your Invite Link">
      <Space wrap size="middle">
        <Button
          icon={<FacebookOutlined />}
          onClick={shareOnFacebook}
          style={{ backgroundColor: '#1877F2', color: 'white' }}
          size="large"
        >
          Facebook
        </Button>
        
        <Button
          icon={<TwitterOutlined />}
          onClick={shareOnTwitter}
          style={{ backgroundColor: '#1DA1F2', color: 'white' }}
          size="large"
        >
          Twitter
        </Button>
        
        <Button
          onClick={shareOnLine}
          style={{ backgroundColor: '#00B900', color: 'white' }}
          size="large"
        >
          LINE
        </Button>
        
        <Button
          icon={<MailOutlined />}
          onClick={shareViaEmail}
          size="large"
        >
          Email
        </Button>
        
        <Button
          icon={<WhatsAppOutlined />}
          onClick={shareOnWhatsApp}
          style={{ backgroundColor: '#25D366', color: 'white' }}
          size="large"
        >
          WhatsApp
        </Button>
        
        <Button
          icon={<LinkOutlined />}
          onClick={copyShareLink}
          size="large"
        >
          Copy Link
        </Button>
      </Space>
      
      <div style={{ 
        marginTop: 16, 
        padding: '12px', 
        backgroundColor: '#f6f8fa', 
        borderRadius: '6px',
        border: '1px solid #e1e4e8'
      }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          Share your invite link on social media platforms to invite friends to join Smart AI Hub. 
          You'll earn rewards when they sign up using your link!
        </p>
      </div>
    </Card>
  );
};