import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Card,
  Select,
  Radio,
  Input,
  Avatar,
  Typography,
  Modal,
  Row,
  Col,
  Dropdown,
  Menu,
} from 'antd';
import {
  BlockOutlined,
  UnlockOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  EyeOutlined,
  SendOutlined,
  FilterOutlined,
  ClearOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const { Text } = Typography;
const { Search } = Input;

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Interface for member data
interface Member {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  tier: string;
  points: number;
  credits: number;
  isBlocked: boolean;
  joinDate: string;
}

// Interface for filters
interface MemberFilters {
  tiers: string[];
  status: 'all' | 'active' | 'blocked';
  search: string;
}

// Tier order for sorting
const tierOrder: Record<string, number> = {
  administrator: 0,
  agency: 1,
  organization: 2,
  admin: 3,
  general: 4,
};

// Tier colors
function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    administrator: 'purple',
    agency: 'blue',
    organization: 'green',
    admin: 'orange',
    general: 'default',
  };
  return colors[tier] || 'default';
}

// Check if user can block target
function canBlock(userTier: string, targetTier: string): boolean {
  const hierarchy = ['administrator', 'agency', 'organization', 'admin', 'general'];
  const userLevel = hierarchy.indexOf(userTier);
  const targetLevel = hierarchy.indexOf(targetTier);
  return userLevel < targetLevel;
}

// Filter Section Component
const FilterSection: React.FC<{
  filters: MemberFilters;
  onChange: (filters: MemberFilters) => void;
}> = ({ filters, onChange }) => {
  return (
    <Card
      title={
        <>
          <FilterOutlined /> Filters
        </>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Tier</Text>
          <Select
            mode="multiple"
            placeholder="Select tiers"
            value={filters.tiers}
            onChange={(tiers) => onChange({ ...filters, tiers })}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Select.Option value="administrator">Administrator</Select.Option>
            <Select.Option value="agency">Agency</Select.Option>
            <Select.Option value="organization">Organization</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="general">General</Select.Option>
          </Select>
        </div>

        <div>
          <Text strong>Status</Text>
          <Radio.Group
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            style={{ marginTop: 8 }}
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="active">Active</Radio.Button>
            <Radio.Button value="blocked">Blocked</Radio.Button>
          </Radio.Group>
        </div>

        <div>
          <Text strong>Search</Text>
          <Search
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            style={{ marginTop: 8 }}
            allowClear
          />
        </div>

        <Button
          icon={<ClearOutlined />}
          onClick={() => onChange({ tiers: [], status: 'all', search: '' })}
          block
        >
          Clear Filters
        </Button>
      </Space>
    </Card>
  );
};

// Export buttons component
const ExportButtons: React.FC<{
  members: Member[];
  selectedRowKeys: React.Key[];
}> = ({ members, selectedRowKeys }) => {
  const handleExportCSV = () => {
    const dataToExport =
      selectedRowKeys.length > 0 ? members.filter((m) => selectedRowKeys.includes(m.id)) : members;

    const csv = [
      ['Name', 'Email', 'Tier', 'Points', 'Credits', 'Status', 'Join Date'],
      ...dataToExport.map((m) => [
        m.name || m.email,
        m.email,
        m.tier,
        m.points,
        m.credits,
        m.isBlocked ? 'Blocked' : 'Active',
        new Date(m.joinDate).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `members_${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('CSV exported successfully');
  };

  const handleExportExcel = () => {
    // For Excel export, we would need a library like xlsx
    // For now, we'll show a message
    message.info('Excel export would require additional library (xlsx)');
  };

  return (
    <Space>
      <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
        Export CSV
      </Button>
      <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
        Export Excel
      </Button>
    </Space>
  );
};

// Main Component
export const MemberList: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState<MemberFilters>({
    tiers: [],
    status: 'all',
    search: '',
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    fetchMembers();
  }, [pagination.current, pagination.pageSize]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/hierarchy/members?` +
          new URLSearchParams({
            page: pagination.current.toString(),
            limit: pagination.pageSize.toString(),
          })
      );

      const data = await res.json();
      setMembers(data.data || []);
      setPagination((prev) => ({ ...prev, total: data.total || 0 }));
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId,
          reason: 'Blocked from member list',
        }),
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId }),
      });
      message.success('User unblocked successfully');
      fetchMembers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to unblock user');
    }
  };

  const handleViewDetails = (record: Member) => {
    Modal.info({
      title: 'Member Details',
      width: 600,
      content: (
        <div>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Avatar src={record.avatar} size={64}>
                {(record.name || record.email)[0]?.toUpperCase()}
              </Avatar>
            </Col>
            <Col span={16}>
              <p>
                <strong>Name:</strong> {record.name || 'Not set'}
              </p>
              <p>
                <strong>Email:</strong> {record.email}
              </p>
              <p>
                <strong>Tier:</strong>{' '}
                <Tag color={getTierColor(record.tier)}>{record.tier.toUpperCase()}</Tag>
              </p>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}>
              <p>
                <strong>Points:</strong> {record.points.toLocaleString()}
              </p>
              <p>
                <strong>Credits:</strong> {record.credits.toLocaleString()}
              </p>
            </Col>
            <Col span={12}>
              <p>
                <strong>Status:</strong>{' '}
                <Tag color={record.isBlocked ? 'red' : 'green'}>
                  {record.isBlocked ? 'Blocked' : 'Active'}
                </Tag>
              </p>
              <p>
                <strong>Join Date:</strong> {new Date(record.joinDate).toLocaleDateString()}
              </p>
            </Col>
          </Row>
        </div>
      ),
    });
  };

  const handleTransfer = (record: Member) => {
    // This would open a transfer modal or navigate to transfer page
    message.info(`Opening transfer to ${record.email}`);
  };

  // Bulk actions
  const handleBulkBlock = async () => {
    Modal.confirm({
      title: `Block ${selectedRowKeys.length} members?`,
      content: 'Selected members will not be able to access the system.',
      onOk: async () => {
        try {
          await fetch(`${API_BASE_URL}/api/v1/bulk/block`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ userIds: selectedRowKeys }),
          });
          message.success('Members blocked successfully');
          setSelectedRowKeys([]);
          fetchMembers();
        } catch (error) {
          message.error('Failed to block members');
        }
      },
    });
  };

  const handleBulkUnblock = async () => {
    Modal.confirm({
      title: `Unblock ${selectedRowKeys.length} members?`,
      content: 'Selected members will regain access to the system.',
      onOk: async () => {
        try {
          await fetch(`${API_BASE_URL}/api/v1/bulk/unblock`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ userIds: selectedRowKeys }),
          });
          message.success('Members unblocked successfully');
          setSelectedRowKeys([]);
          fetchMembers();
        } catch (error) {
          message.error('Failed to unblock members');
        }
      },
    });
  };

  const handleBulkTransfer = () => {
    message.info(`Opening transfer to ${selectedRowKeys.length} selected members`);
  };

  // Filter members based on filters
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Apply tier filter
      if (filters.tiers.length > 0 && !filters.tiers.includes(member.tier)) return false;

      // Apply status filter
      if (filters.status !== 'all' && member.isBlocked !== (filters.status === 'blocked'))
        return false;

      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = member.name?.toLowerCase().includes(searchLower);
        const emailMatch = member.email.toLowerCase().includes(searchLower);
        if (!nameMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [members, filters]);

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Member, b: Member) => (a.name || a.email).localeCompare(b.name || b.email),
      render: (name: string, record: Member) => (
        <Space>
          <Avatar src={record.avatar}>{(name || record.email)[0]?.toUpperCase()}</Avatar>
          <div>
            <Text strong>{name || 'No name'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      sorter: (a: Member, b: Member) => tierOrder[a.tier] - tierOrder[b.tier],
      render: (tier: string) => <Tag color={getTierColor(tier)}>{tier.toUpperCase()}</Tag>,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      sorter: (a: Member, b: Member) => a.points - b.points,
      render: (points: number) => points.toLocaleString(),
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      sorter: (a: Member, b: Member) => a.credits - b.credits,
      render: (credits: number) => credits.toLocaleString(),
    },
    {
      title: 'Join Date',
      dataIndex: 'joinDate',
      key: 'joinDate',
      sorter: (a: Member, b: Member) =>
        new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'isBlocked',
      key: 'status',
      render: (isBlocked: boolean) => (
        <Tag color={isBlocked ? 'red' : 'green'}>{isBlocked ? 'Blocked' : 'Active'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Member) => {
        const canPerformActions = canBlock(user?.tier || '', record.tier);

        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => handleViewDetails(record),
          },
          {
            key: 'transfer',
            icon: <SendOutlined />,
            label: 'Transfer',
            onClick: () => handleTransfer(record),
          },
        ];

        if (canPerformActions) {
          menuItems.push({
            key: record.isBlocked ? 'unblock' : 'block',
            icon: record.isBlocked ? <UnlockOutlined /> : <BlockOutlined />,
            label: record.isBlocked ? 'Unblock' : 'Block',
            onClick: () => (record.isBlocked ? handleUnblock(record.id) : handleBlock(record.id)),
          });
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    getCheckboxProps: (record: Member) => ({
      disabled: !canBlock(user?.tier || '', record.tier),
    }),
  };

  // Pagination config
  const paginationConfig = {
    ...pagination,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `Total ${total} members`,
    pageSizeOptions: ['10', '20', '50', '100'],
    onChange: (page: number, pageSize: number) => {
      setPagination({ ...pagination, current: page, pageSize });
    },
  };

  // Bulk actions bar
  const BulkActionsBar = () => (
    <Space style={{ marginBottom: 16 }}>
      <Text>{selectedRowKeys.length} selected</Text>
      <Button onClick={handleBulkBlock}>Block Selected</Button>
      <Button onClick={handleBulkUnblock}>Unblock Selected</Button>
      <Button onClick={handleBulkTransfer}>Transfer to Selected</Button>
      <Button onClick={() => setSelectedRowKeys([])}>Clear Selection</Button>
    </Space>
  );

  return (
    <div className="member-list">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <FilterSection filters={filters} onChange={setFilters} />
        </Col>
        <Col xs={24} md={18}>
          <Card
            title="Members"
            extra={<ExportButtons members={filteredMembers} selectedRowKeys={selectedRowKeys} />}
          >
            {selectedRowKeys.length > 0 && <BulkActionsBar />}
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={filteredMembers}
              loading={loading}
              pagination={paginationConfig}
              rowKey="id"
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
