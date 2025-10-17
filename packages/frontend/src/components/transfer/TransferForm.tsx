import React, { useState, useEffect } from 'react';
import {
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  message,
  Radio,
  Space,
  Card,
  Alert,
  Modal,
  Avatar,
  Typography,
  List,
  AutoComplete,
  Row,
  Col,
  notification,
  Descriptions,
} from 'antd';
import {
  SendOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tier: string;
}

interface Transfer {
  id: string;
  recipient: User;
  amount: number;
  type: 'points' | 'credits';
  date: string;
}

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// User Search Autocomplete Component
interface UserSearchAutocompleteProps {
  onSelect: (user: User) => void;
  selected: User | null;
}

const UserSearchAutocomplete: React.FC<UserSearchAutocompleteProps> = ({ onSelect, selected }) => {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value: string) => {
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/v1/users/search?q=${encodeURIComponent(value)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      // Results are already filtered by visibility rules on backend
      setSearchResults(data.users || []);
    } catch (error) {
      message.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (value: string) => {
    const user = searchResults.find((u) => u.id === value);
    if (user) {
      onSelect(user);
    }
  };

  return (
    <AutoComplete
      style={{ width: '100%' }}
      onSearch={handleSearch}
      onSelect={handleSelect}
      placeholder="Search by name or email"
      notFoundContent={searching ? 'Searching...' : 'No results'}
      value={selected ? `${selected.name || selected.email} (${selected.tier})` : undefined}
    >
      {searchResults.map((user) => (
        <AutoComplete.Option key={user.id} value={user.id}>
          <Space>
            <Avatar src={user.avatar} icon={<UserOutlined />}>
              {user.name ? user.name[0] : user.email[0]?.toUpperCase()}
            </Avatar>
            <div>
              <Text strong>{user.name || 'No name'}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {user.email}
              </Text>
            </div>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{user.tier.toUpperCase()}</span>
          </Space>
        </AutoComplete.Option>
      ))}
    </AutoComplete>
  );
};

// Recent Transfers Component
const RecentTransfers: React.FC<{ transfers: Transfer[] }> = ({ transfers }) => {
  const handleRepeatTransfer = (transfer: Transfer) => {
    // This would populate the form with the transfer data
    message.info(`Preparing repeat transfer to ${transfer.recipient.email}`);
  };

  return (
    <Card
      title="Recent Transfers"
      extra={<Link to="/transfer/history">View All →</Link>}
      size="small"
    >
      <List
        dataSource={transfers}
        renderItem={(transfer) => (
          <List.Item
            actions={[
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => handleRepeatTransfer(transfer)}
              >
                Repeat
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar src={transfer.recipient.avatar} icon={<UserOutlined />}>
                  {transfer.recipient.name
                    ? transfer.recipient.name[0]
                    : transfer.recipient.email[0]?.toUpperCase()}
                </Avatar>
              }
              title={transfer.recipient.name || transfer.recipient.email}
              description={`${transfer.amount.toLocaleString()} ${transfer.type} • ${new Date(transfer.date).toLocaleDateString()}`}
            />
          </List.Item>
        )}
        locale={{ emptyText: 'No recent transfers' }}
      />
    </Card>
  );
};

// Main Component
export const TransferForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState<User | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [transferType, setTransferType] = useState<'points' | 'credits'>('points');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<Transfer[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [creditsBalance, setCreditsBalance] = useState(0);

  useEffect(() => {
    fetchBalances();
    fetchRecentTransfers();
  }, []);

  const fetchBalances = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wallet/balance`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setPointsBalance(data.points || 0);
      setCreditsBalance(data.credits || 0);
    } catch (error) {
      console.error('Failed to fetch balances');
    }
  };

  const fetchRecentTransfers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/transfer/recent`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setRecentTransfers(data.transfers || []);
    } catch (error) {
      console.error('Failed to fetch recent transfers');
    }
  };

  const validateTransfer = async (
    recipientUser: User,
    transferAmount: number,
    type: 'points' | 'credits'
  ) => {
    const errors = [];

    // Check if recipient is selected
    if (!recipientUser) {
      errors.push('Please select a recipient');
    }

    // Check amount
    if (transferAmount < 1) {
      errors.push('Amount must be at least 1');
    }

    // Check balance
    const currentBalance = type === 'points' ? pointsBalance : creditsBalance;
    if (transferAmount > currentBalance) {
      errors.push(`Insufficient ${type}. You have ${currentBalance} ${type}.`);
    }

    // Check authorization
    if (recipientUser) {
      try {
        const response = await fetch('/api/v1/transfer/check-authorization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ recipientId: recipientUser.id }),
        });
        const { authorized, reason } = await response.json();
        if (!authorized) {
          errors.push(reason || 'You are not authorized to transfer to this user');
        }
      } catch (error) {
        errors.push('Authorization check failed');
      }
    }

    return errors;
  };

  const showConfirmDialog = () => {
    const currentBalance = transferType === 'points' ? pointsBalance : creditsBalance;
    const balanceAfter = currentBalance - amount;

    Modal.confirm({
      title: 'Confirm Transfer',
      icon: <ExclamationCircleOutlined />,
      width: 500,
      content: (
        <div>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Recipient">
              <Space>
                <Avatar src={recipient?.avatar} icon={<UserOutlined />}>
                  {recipient?.name ? recipient?.name[0] : recipient?.email[0]?.toUpperCase()}
                </Avatar>
                <div>
                  <Text strong>{recipient?.name || 'No name'}</Text>
                  <br />
                  <Text type="secondary">{recipient?.email}</Text>
                </div>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ fontSize: 18 }}>
                {amount.toLocaleString()} {transferType === 'points' ? 'Points' : 'Credits'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Your Balance After">
              <Text type={balanceAfter < 0 ? 'danger' : 'success'}>
                {balanceAfter.toLocaleString()} {transferType === 'points' ? 'Points' : 'Credits'}
              </Text>
            </Descriptions.Item>
          </Descriptions>
          <Alert
            message="This action cannot be undone"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      okText: 'Confirm Transfer',
      cancelText: 'Cancel',
      onOk: handleTransfer,
    });
  };

  const handleSubmit = async () => {
    const errors = await validateTransfer(recipient!, amount, transferType);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    showConfirmDialog();
  };

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const endpoint =
        transferType === 'points' ? '/api/v1/transfer/points' : '/api/v1/transfer/credits';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: recipient?.id,
          amount,
          description: form.getFieldValue('note'),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        notification.success({
          message: 'Transfer Successful',
          description: (
            <div>
              <p>
                Transferred {amount.toLocaleString()} {transferType} to{' '}
                {recipient?.name || recipient?.email}
              </p>
              <p>Transaction ID: {data.transactionId}</p>
              <Link to="/transfer/history">View History →</Link>
            </div>
          ),
          duration: 5,
        });

        // Reset form
        form.resetFields();
        setRecipient(null);
        setAmount(0);
        setValidationErrors([]);

        // Refresh data
        fetchBalances();
        fetchRecentTransfers();
      } else {
        throw new Error(data.error || 'Transfer failed');
      }
    } catch (error: any) {
      notification.error({
        message: 'Transfer Failed',
        description: error.message || 'An error occurred during transfer',
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = transferType === 'points' ? pointsBalance : creditsBalance;

  return (
    <div className="transfer-form">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Transfer Points or Credits">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={(changedValues) => {
                if (changedValues.amount !== undefined) {
                  setAmount(changedValues.amount);
                }
              }}
            >
              <Form.Item
                label="Recipient"
                required
                validateStatus={recipient ? 'success' : 'error'}
                help={!recipient ? 'Please select a recipient' : ''}
              >
                <UserSearchAutocomplete onSelect={setRecipient} selected={recipient} />
              </Form.Item>

              <Form.Item label="Transfer Type" required>
                <Radio.Group value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                  <Radio.Button value="points">Points</Radio.Button>
                  <Radio.Button value="credits">Credits</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="amount"
                label="Amount"
                required
                rules={[
                  { required: true, message: 'Please enter amount' },
                  { type: 'number', min: 1, message: 'Amount must be greater than 0' },
                  {
                    validator: (_, value) => {
                      if (value > currentBalance) {
                        return Promise.reject(
                          `Insufficient balance. You have ${currentBalance} ${transferType}`
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={currentBalance}
                  style={{ width: '100%' }}
                  size="large"
                  placeholder={`Enter amount (max: ${currentBalance})`}
                />
              </Form.Item>

              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                  Available: {currentBalance.toLocaleString()} {transferType}
                </Text>
              </div>

              <Form.Item name="note" label="Note (optional)">
                <TextArea
                  rows={3}
                  placeholder="Add a note for the recipient (optional)"
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              {validationErrors.length > 0 && (
                <Alert
                  message="Validation Errors"
                  description={
                    <ul>
                      {validationErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                  closable
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  loading={loading}
                  block
                  disabled={!recipient || amount <= 0}
                >
                  Transfer {amount > 0 ? `${amount.toLocaleString()} ${transferType}` : ''}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <RecentTransfers transfers={recentTransfers} />
        </Col>
      </Row>
    </div>
  );
};
