import React, { useState } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Button } from 'antd';
import { InviteCodeCard } from '../components/invite/InviteCodeCard';
import { QRCodeGenerator } from '../components/invite/QRCodeGenerator';
import { SocialShareButtons } from '../components/invite/SocialShareButtons';
import { useReferral } from '../hooks/useReferral';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const Invite: React.FC = () => {
  const [regenerating, setRegenerating] = useState(false);
  
  const {
    data,
    loading,
    error,
    refetch,
    regenerateCode
  } = useReferral();

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    try {
      await regenerateCode();
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Invite Friends</Title>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading invite data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Invite Friends</Title>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: '#ff4d4f' }}>Failed to load invite data</p>
            <p>{error.message}</p>
            <Button type="primary" onClick={refetch}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Invite Friends</Title>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>No invite data available</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Invite Friends</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={refetch}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Invite Code and QR Code */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <InviteCodeCard
            code={data.inviteCode}
            link={data.inviteLink}
            onRegenerate={handleRegenerateCode}
            loading={regenerating}
          />
        </Col>
        <Col xs={24} md={12}>
          <QRCodeGenerator value={data.inviteLink} />
        </Col>
      </Row>

      {/* Social Sharing */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <SocialShareButtons link={data.inviteLink} />
        </Col>
      </Row>

      {/* Instructions */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="How to Use Your Invite Code">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div>
                  <Title level={4}>For Your Friends:</Title>
                  <Paragraph>
                    1. Click on your invite link or go to the registration page<br />
                    2. Enter your invite code: <strong>{data.inviteCode}</strong><br />
                    3. Complete the registration process<br />
                    4. Start using Smart AI Hub!
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div>
                  <Title level={4}>Benefits:</Title>
                  <Paragraph>
                    • Your friends get access to Smart AI Hub<br />
                    • You earn points for each successful referral<br />
                    • Points vary based on the tier of the referred user<br />
                    • Track all your referrals and rewards in real-time
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Alert
            message="Referral Statistics"
            description={
              <div>
                <p>Total Referrals: <strong>{data.totalReferrals}</strong></p>
                <p>Active Referrals: <strong>{data.activeReferrals}</strong></p>
                <p>Total Rewards Earned: <strong>{data.totalRewards.toLocaleString()} Points</strong></p>
              </div>
            }
            type="info"
            showIcon
          />
        </Col>
      </Row>

      {/* Tips */}
      <Card title="Tips for Successful Invitations" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={5}>Personalize Your Message</Title>
              <Paragraph>
                Add a personal note when sharing your invite link. Let people know why you find Smart AI Hub valuable.
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={5}>Share on Multiple Platforms</Title>
              <Paragraph>
                Use different social media platforms to reach more people. Each platform has its own audience.
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={5}>Follow Up</Title>
              <Paragraph>
                Don't hesitate to follow up with people you've invited. Answer their questions about the platform.
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};