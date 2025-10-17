import React, { useState } from 'react';
import { Card, Row, Col, Spin, Typography, message } from 'antd';
import { ReferralStatistics } from '../components/referral/ReferralStatistics';
import { ReferralList } from '../components/referral/ReferralList';
import { ReferralRewardsHistory } from '../components/referral/ReferralRewardsHistory';
import { useReferral } from '../hooks/useReferral';

const { Title } = Typography;

export const Referrals: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rewardsPage, setRewardsPage] = useState(1);
  const [rewardsPageSize, setRewardsPageSize] = useState(10);
  
  const {
    data,
    referralList,
    rewardsHistory,
    stats,
    loading,
    error,
    refetch,
    refetchList,
    refetchRewards
  } = useReferral();

  const handlePaginationChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    refetchList(page, size);
  };

  const handleRewardsPaginationChange = (page: number, size: number) => {
    setRewardsPage(page);
    setRewardsPageSize(size);
    refetchRewards(page, size);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Referrals</Title>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading referral data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Referrals</Title>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ color: '#ff4d4f' }}>Failed to load referral data</p>
            <p>{error.message}</p>
            <button onClick={refetch}>Retry</button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data || !stats) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2}>Referrals</Title>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>No referral data available</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Referrals</Title>
      
      {/* Statistics Section */}
      <ReferralStatistics
        totalReferrals={stats.totalReferrals}
        activeReferrals={stats.activeReferrals}
        totalRewards={stats.totalRewards}
        chartData={stats.chartData || []}
      />

      {/* Main Content */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Referrals List */}
        <Col xs={24} lg={16}>
          <Card title="Referred Users" style={{ height: '100%' }}>
            <ReferralList
              referrals={referralList}
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: referralList.length,
                onChange: handlePaginationChange,
              }}
            />
          </Card>
        </Col>

        {/* Rewards History */}
        <Col xs={24} lg={8}>
          <ReferralRewardsHistory
            rewards={rewardsHistory}
            totalRewards={stats.totalRewards}
          />
        </Col>
      </Row>

      {/* Instructions */}
      <Card 
        title="How to Earn Rewards" 
        style={{ marginTop: 24 }}
        type="inner"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: '#1890ff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                1
              </div>
              <Title level={5}>Share Your Invite Link</Title>
              <p style={{ color: '#666' }}>
                Share your unique invite code or link with friends and colleagues
              </p>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: '#52c41a', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                2
              </div>
              <Title level={5}>They Sign Up</Title>
              <p style={{ color: '#666' }}>
                When someone signs up using your invite code, they become your referral
              </p>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                backgroundColor: '#faad14', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                3
              </div>
              <Title level={5}>Earn Rewards</Title>
              <p style={{ color: '#666' }}>
                Receive points based on the tier of the user who signed up
              </p>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};