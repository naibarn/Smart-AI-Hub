import React, { useState, useEffect } from 'react';
import { Table, Tag, Input, Space, Avatar, Typography } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { TierBadge } from '../hierarchy/TierBadge';
import type { ColumnType } from 'antd/es/table';
import type { Key } from 'react';

const { Text } = Typography;

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  tier: string;
  signupDate: string;
  status: 'active' | 'blocked';
  reward: number;
}

interface ReferralListProps {
  referrals: ReferredUser[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

export const ReferralList: React.FC<ReferralListProps> = ({
  referrals,
  loading,
  pagination
}) => {
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState<ReferredUser[]>(referrals);

  useEffect(() => {
    if (searchText) {
      const filtered = referrals.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(referrals);
    }
  }, [searchText, referrals]);

  const columns: ColumnType<ReferredUser>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ReferredUser) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
      sorter: (a: ReferredUser, b: ReferredUser) => a.name.localeCompare(b.name),
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => <TierBadge tier={tier as any} size="small" />,
      filters: [
        { text: 'Agency', value: 'agency' },
        { text: 'Organization', value: 'organization' },
        { text: 'Admin', value: 'admin' },
        { text: 'General', value: 'general' },
      ],
      onFilter: (value: boolean | Key, record: ReferredUser) => record.tier === String(value),
    },
    {
      title: 'Signup Date',
      dataIndex: 'signupDate',
      key: 'signupDate',
      render: (date: string) => {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        return <Text>{formattedDate}</Text>;
      },
      sorter: (a: ReferredUser, b: ReferredUser) => 
        new Date(a.signupDate).getTime() - new Date(b.signupDate).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Blocked', value: 'blocked' },
      ],
      onFilter: (value: boolean | Key, record: ReferredUser) => record.status === String(value),
    },
    {
      title: 'Reward',
      dataIndex: 'reward',
      key: 'reward',
      render: (reward: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {reward.toLocaleString()} Points
        </Text>
      ),
      sorter: (a: ReferredUser, b: ReferredUser) => a.reward - b.reward,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by name or email"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} referrals`,
        }}
        rowKey="id"
        scroll={{ x: 800 }}
        size="middle"
      />
    </div>
  );
};