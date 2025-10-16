import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message } from 'antd';
import { BlockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const MemberList: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  
  useEffect(() => {
    fetchMembers();
  }, [pagination.page]);
  
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/hierarchy/members?` + new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      }));
      
      const data = await res.json();
      setMembers(data.data);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      message.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBlock = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          reason: 'Blocked from member list'
        })
      });
      
      message.success('User blocked successfully');
      fetchMembers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to block user');
    }
  };
  
  const handleUnblock = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/block/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });
      message.success('User unblocked successfully');
      fetchMembers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to unblock user');
    }
  };
  
  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => (
        <Tag color={getTierColor(tier)}>{tier.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => points.toLocaleString()
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      render: (credits: number) => credits.toLocaleString()
    },
    {
      title: 'Status',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      render: (isBlocked: boolean) => (
        <Tag color={isBlocked ? 'red' : 'green'}>
          {isBlocked ? 'Blocked' : 'Active'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {canBlock(user?.tier || '', record.tier) && (
            <>
              {record.isBlocked ? (
                <Button
                  size="small"
                  icon={<UnlockOutlined />}
                  onClick={() => handleUnblock(record.id)}
                >
                  Unblock
                </Button>
              ) : (
                <Button
                  size="small"
                  danger
                  icon={<BlockOutlined />}
                  onClick={() => handleBlock(record.id)}
                >
                  Block
                </Button>
              )}
            </>
          )}
        </Space>
      )
    }
  ];
  
  return (
    <Table
      columns={columns}
      dataSource={members}
      loading={loading}
      rowKey="id"
      pagination={{
        current: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        onChange: (page: any) => setPagination(prev => ({ ...prev, page }))
      }}
    />
  );
};

function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    administrator: 'purple',
    agency: 'blue',
    organization: 'green',
    admin: 'orange',
    general: 'default'
  };
  return colors[tier] || 'default';
}

function canBlock(userTier: string, targetTier: string): boolean {
  const hierarchy = ['administrator', 'agency', 'organization', 'admin', 'general'];
  const userLevel = hierarchy.indexOf(userTier);
  const targetLevel = hierarchy.indexOf(targetTier);
  return userLevel < targetLevel;
}