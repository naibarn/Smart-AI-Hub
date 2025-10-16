import React, { useState } from 'react';
import { Card, Button, Tabs, Table, Modal, Form, Input, message, Row, Col, Statistic, Space } from 'antd';
import { DollarOutlined, SwapOutlined, GiftOutlined } from '@ant-design/icons';
import {
  useGetWalletBalanceQuery,
  useExchangeCreditsToPointsMutation,
  usePurchasePointsMutation,
  useClaimDailyRewardMutation
} from '../../services/api';

export const PointsCreditsDashboard: React.FC = () => {
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  
  // RTK Query hooks
  const { data: walletData, isLoading: balanceLoading, refetch: refetchBalance } = useGetWalletBalanceQuery();
  const [exchangeCredits, { isLoading: exchangeLoading }] = useExchangeCreditsToPointsMutation();
  const [purchasePoints, { isLoading: purchaseLoading }] = usePurchasePointsMutation();
  const [claimDailyReward, { isLoading: claimLoading }] = useClaimDailyRewardMutation();
  
  const balance = walletData || { points: 0, credits: 0 };
  const exchangeRate = { creditToPointsRate: 1000, pointsToDollarRate: 10000 };
  const loading = balanceLoading || exchangeLoading || purchaseLoading || claimLoading;
  
  const handleExchange = async (values: any) => {
    try {
      await exchangeCredits({ creditAmount: values.credits }).unwrap();
      message.success('Exchange successful!');
      setExchangeModalVisible(false);
      refetchBalance();
    } catch (error: any) {
      message.error(error.data?.message || 'Exchange failed');
    }
  };
  
  const handlePurchase = async (values: any) => {
    try {
      // Integrate with payment gateway here
      const paymentResult = await processPayment(values.amountUSD) as {
        method: string;
        id: string;
      };
      
      await purchasePoints({
        pointsAmount: Math.floor(values.amountUSD * exchangeRate.pointsToDollarRate),
        paymentDetails: {
          stripeSessionId: paymentResult.id,
          amount: values.amountUSD
        }
      }).unwrap();
      
      message.success('Purchase successful!');
      setPurchaseModalVisible(false);
      refetchBalance();
    } catch (error: any) {
      message.error(error.data?.message || 'Purchase failed');
    }
  };
  
  const handleClaimDailyReward = async () => {
    try {
      const result = await claimDailyReward().unwrap();
      message.success(`Claimed ${result.points} points!`);
      refetchBalance();
    } catch (error: any) {
      message.error(error.data?.message || 'Already claimed today');
    }
  };
  
  return (
    <div className="points-credits-dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Points Balance"
              value={balance.points}
              precision={0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Credits Balance"
              value={balance.credits}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Actions" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => setExchangeModalVisible(true)}
              block
            >
              Exchange Credits to Points
            </Button>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              icon={<DollarOutlined />}
              onClick={() => setPurchaseModalVisible(true)}
              block
            >
              Purchase Points
            </Button>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              icon={<GiftOutlined />}
              onClick={handleClaimDailyReward}
              loading={loading}
              block
            >
              Claim Daily Reward
            </Button>
          </Col>
        </Row>
      </Card>
      
      <Card title="Exchange Rate" style={{ marginTop: 16 }}>
        <p>1 Credit = {exchangeRate.creditToPointsRate.toLocaleString()} Points</p>
        <p>{exchangeRate.pointsToDollarRate.toLocaleString()} Points = $1 USD</p>
      </Card>
      
      {/* Exchange Modal */}
      <Modal
        title="Exchange Credits to Points"
        open={exchangeModalVisible}
        onCancel={() => setExchangeModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleExchange}>
          <Form.Item
            name="credits"
            label="Credits"
            rules={[{ required: true, message: 'Please enter credits amount' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Exchange
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Purchase Modal */}
      <Modal
        title="Purchase Points"
        open={purchaseModalVisible}
        onCancel={() => setPurchaseModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handlePurchase}>
          <Form.Item
            name="amountUSD"
            label="Amount (USD)"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <Input type="number" min={1} />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Purchase
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Mock payment processing function
const processPayment = async (amountUSD: number) => {
  // This would integrate with a real payment gateway
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        method: 'credit_card',
        id: `payment-${Math.random().toString(36).substr(2, 9)}`
      });
    }, 1000);
  });
};