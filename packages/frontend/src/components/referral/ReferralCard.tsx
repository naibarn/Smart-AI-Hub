import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  message,
  QRCode,
  Statistic,
  Row,
  Col,
  Typography,
  Space,
  Divider,
} from 'antd';
import {
  CopyOutlined,
  QrcodeOutlined,
  DownloadOutlined,
  FacebookOutlined,
  TwitterOutlined,
  MailOutlined,
  WhatsAppOutlined,
  UserAddOutlined,
  TeamOutlined,
  TrophyOutlined,
  CheckOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// QR Code Section Component
const QRCodeSection: React.FC<{ inviteLink: string }> = ({ inviteLink }) => {
  const downloadQRCode = () => {
    const canvas = document.getElementById('referral-qr-code') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'invite-qr-code.png';
      link.href = url;
      link.click();
      message.success('QR Code downloaded successfully!');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <QRCode id="referral-qr-code" value={inviteLink} size={200} level="H" includeMargin />
      <br />
      <Button icon={<DownloadOutlined />} onClick={downloadQRCode} style={{ marginTop: 16 }}>
        Download QR Code
      </Button>
    </div>
  );
};

// Social Share Section Component
const SocialShareSection: React.FC<{ inviteLink: string }> = ({ inviteLink }) => {
  const shareMessage = 'Join Smart AI Hub using my invite link!';

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(inviteLink)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteLink)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=Join Smart AI Hub&body=${encodeURIComponent(shareMessage + '\n\n' + inviteLink)}`;
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + inviteLink)}`,
      '_blank'
    );
  };

  return (
    <Space wrap>
      <Button
        icon={<FacebookOutlined />}
        onClick={shareOnFacebook}
        style={{ backgroundColor: '#1877F2', color: 'white' }}
      >
        Facebook
      </Button>
      <Button
        icon={<TwitterOutlined />}
        onClick={shareOnTwitter}
        style={{ backgroundColor: '#1DA1F2', color: 'white' }}
      >
        Twitter
      </Button>
      <Button onClick={shareOnLine} style={{ backgroundColor: '#00B900', color: 'white' }}>
        Line
      </Button>
      <Button icon={<MailOutlined />} onClick={shareViaEmail}>
        Email
      </Button>
      <Button
        icon={<WhatsAppOutlined />}
        onClick={shareOnWhatsApp}
        style={{ backgroundColor: '#25D366', color: 'white' }}
      >
        WhatsApp
      </Button>
    </Space>
  );
};

// Statistics Section Component
const StatisticsSection: React.FC<{
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
}> = ({ totalReferrals, activeReferrals, totalRewards }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Statistic
          title="Total Referrals"
          value={totalReferrals}
          prefix={<UserAddOutlined />}
          valueStyle={{ color: '#1890ff' }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="Active Referrals"
          value={activeReferrals}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#52c41a' }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="Total Rewards"
          value={totalRewards}
          prefix={<TrophyOutlined />}
          suffix="Points"
          valueStyle={{ color: '#faad14' }}
        />
      </Col>
    </Row>
  );
};

// Copy Link Button Component
const CopyLinkButton: React.FC<{ inviteLink: string }> = ({ inviteLink }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    message.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="primary"
      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
      onClick={handleCopy}
      size="large"
      block
    >
      {copied ? 'Copied!' : 'Copy Invite Link'}
    </Button>
  );
};

// Main Component
export const ReferralCard: React.FC = () => {
  const [data, setData] = useState<{
    inviteCode: string;
    totalReferrals: number;
    activeReferrals: number;
    totalRewards: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      // Fetch invite code
      const inviteRes = await fetch(`${API_BASE_URL}/api/v1/referral/invite-code`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const inviteData = await inviteRes.json();

      // Fetch stats
      const statsRes = await fetch(`${API_BASE_URL}/api/v1/referral/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const statsData = await statsRes.json();

      setData({
        inviteCode: inviteData.data?.inviteCode || '',
        totalReferrals: statsData.data?.totalReferrals || 0,
        activeReferrals: statsData.data?.activeReferrals || 0,
        totalRewards: statsData.data?.totalRewards || 0,
      });
    } catch (error) {
      message.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading referral data...</div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Failed to load referral data</div>;
  }

  const inviteLink = `${window.location.origin}/register?invite=${data.inviteCode}`;

  return (
    <div className="referral-card">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Your Invite Code">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ textAlign: 'center' }}>
                <Title level={1} style={{ margin: 0, color: '#1890ff' }}>
                  {data.inviteCode}
                </Title>
                <Text type="secondary">Share this code with friends</Text>
              </div>
              <CopyLinkButton inviteLink={inviteLink} />
              <Divider />
              <QRCodeSection inviteLink={inviteLink} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Referral Statistics">
            <StatisticsSection
              totalReferrals={data.totalReferrals}
              activeReferrals={data.activeReferrals}
              totalRewards={data.totalRewards}
            />
          </Card>

          <Card title="Share Your Link" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Text type="secondary">
                Share your referral link on social media to earn rewards when friends join!
              </Text>
              <SocialShareSection inviteLink={inviteLink} />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
