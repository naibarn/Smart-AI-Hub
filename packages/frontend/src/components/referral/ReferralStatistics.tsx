import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { UserAddOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReferralStatisticsProps {
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  chartData: Array<{ date: string; count: number }>;
}

export const ReferralStatistics: React.FC<ReferralStatisticsProps> = ({
  totalReferrals,
  activeReferrals,
  totalRewards,
  chartData
}) => {
  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Referrals"
              value={totalReferrals}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Referrals"
              value={activeReferrals}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Rewards"
              value={totalRewards}
              prefix={<TrophyOutlined />}
              suffix="Points"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Referrals Over Time (Last 30 Days)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#1890ff" 
              strokeWidth={2}
              dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};