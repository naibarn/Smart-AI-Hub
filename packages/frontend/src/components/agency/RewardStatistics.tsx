import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
  TrophyOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const { Title } = Typography;

interface RewardStatisticsData {
  totalRewardsGiven: number;
  organizationSignups: number;
  organizationRewards: number;
  adminSignups: number;
  adminRewards: number;
  generalSignups: number;
  generalRewards: number;
  chartData: Array<{
    tier: string;
    signups: number;
    rewards: number;
  }>;
}

interface RewardStatisticsProps {
  statistics: RewardStatisticsData;
  loading?: boolean;
}

export const RewardStatistics: React.FC<RewardStatisticsProps> = ({
  statistics,
  loading = false,
}) => {
  const totalSignups =
    statistics.organizationSignups + statistics.adminSignups + statistics.generalSignups;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: '#fff',
            padding: '10px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: '#8884d8' }}>Signups: {payload[0].value}</p>
          <p style={{ margin: 0, color: '#82ca9d' }}>
            Rewards: {payload[1].value.toLocaleString()} Points
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="Reward Statistics" loading={loading}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Rewards Given"
              value={statistics.totalRewardsGiven}
              prefix={<TrophyOutlined />}
              suffix="Points"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Organization Signups"
              value={statistics.organizationSignups}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Admin Signups"
              value={statistics.adminSignups}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Signups"
              value={totalSignups}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Organization Rewards"
              value={statistics.organizationRewards}
              prefix={<TrophyOutlined />}
              suffix="Points"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Admin Rewards"
              value={statistics.adminRewards}
              prefix={<TrophyOutlined />}
              suffix="Points"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="General Rewards"
              value={statistics.generalRewards}
              prefix={<TrophyOutlined />}
              suffix="Points"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Title level={4}>Signups and Rewards by Tier</Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statistics.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tier" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="signups"
              fill="#8884d8"
              name="Signups"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="rewards"
              fill="#82ca9d"
              name="Rewards (Points)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
