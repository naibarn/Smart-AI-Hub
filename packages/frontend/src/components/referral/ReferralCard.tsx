import React, { useEffect, useState } from 'react';
import { Card, Button, message, QRCode, Statistic, Row, Col } from 'antd';
import { CopyOutlined, QrcodeOutlined } from '@ant-design/icons';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const ReferralCard: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [stats, setStats] = useState({ totalReferrals: 0, totalRewards: 0 });
  const [showQR, setShowQR] = useState(false);
  
  useEffect(() => {
    fetchInviteCode();
    fetchStats();
  }, []);
  
  const fetchInviteCode = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/referral/invite-code`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setInviteCode(data.data.inviteCode);
    } catch (error) {
      message.error('Failed to fetch invite code');
    }
  };
  
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/referral/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };
  
  const copyInviteLink = () => {
    const link = `${window.location.origin}/register?invite=${inviteCode}`;
    navigator.clipboard.writeText(link);
    message.success('Invite link copied!');
  };
  
  const inviteLink = `${window.location.origin}/register?invite=${inviteCode}`;
  
  return (
    <Card title="Referral Program">
      <Row gutter={16}>
        <Col span={12}>
          <Statistic title="Total Referrals" value={stats.totalReferrals} />
        </Col>
        <Col span={12}>
          <Statistic title="Total Rewards" value={stats.totalRewards} suffix="points" />
        </Col>
      </Row>
      
      <div style={{ marginTop: 24 }}>
        <p><strong>Your Invite Code:</strong> {inviteCode}</p>
        <p><strong>Invite Link:</strong> {inviteLink}</p>
        
        <div style={{ marginTop: 16 }}>
          <Button 
            icon={<CopyOutlined />} 
            onClick={copyInviteLink}
            style={{ marginRight: 8 }}
          >
            Copy Link
          </Button>
          
          <Button 
            icon={<QrcodeOutlined />} 
            onClick={() => setShowQR(!showQR)}
          >
            {showQR ? 'Hide' : 'Show'} QR Code
          </Button>
        </div>
        
        {showQR && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <QRCode value={inviteLink} size={200} />
          </div>
        )}
      </div>
    </Card>
  );
};