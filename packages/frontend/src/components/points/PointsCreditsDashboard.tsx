import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tabs,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  message,
  Row,
  Col,
  Statistic,
  Space,
  Alert,
  Tag,
  Typography,
  Divider,
  Descriptions,
  notification,
  Spin,
} from 'antd';
import {
  DollarOutlined,
  SwapOutlined,
  GiftOutlined,
  TrophyOutlined,
  FireOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  useGetWalletBalanceQuery,
  useExchangeCreditsToPointsMutation,
  usePurchasePointsMutation,
  useClaimDailyRewardMutation,
} from '../../services/api';

const { Title, Text } = Typography;

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Points packages for purchase
const pointsPackages = [
  { points: 10000, price: 1, popular: false },
  { points: 50000, price: 4.5, popular: true, discount: '10%' },
  { points: 100000, price: 8, popular: false, discount: '20%' },
  { points: 500000, price: 35, popular: false, discount: '30%' },
  { points: 1000000, price: 60, popular: false, discount: '40%' },
];

// Daily Reward Section Component
interface DailyRewardSectionProps {
  canClaim: boolean;
  rewardAmount: number;
  streak: number;
  nextRewardTime: string;
  onClaim: () => Promise<void>;
}

const DailyRewardSection: React.FC<DailyRewardSectionProps> = ({
  canClaim,
  rewardAmount,
  streak,
  nextRewardTime,
  onClaim,
}) => {
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await onClaim();
      message.success(`Claimed ${rewardAmount} Points!`);
    } catch (error) {
      message.error('Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Card title="Daily Rewards">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Statistic
          title="Today's Reward"
          value={rewardAmount}
          suffix="Points"
          prefix={<TrophyOutlined />}
        />
        <Statistic title="Current Streak" value={streak} suffix="days" prefix={<FireOutlined />} />
        {canClaim ? (
          <Button
            type="primary"
            size="large"
            icon={<GiftOutlined />}
            onClick={handleClaim}
            loading={claiming}
            block
          >
            Claim Daily Reward
          </Button>
        ) : (
          <>
            <Alert
              message="Already Claimed Today"
              description={`Next reward available in ${nextRewardTime}`}
              type="success"
              showIcon
            />
            <Button disabled block>
              Claimed ✓
            </Button>
          </>
        )}
      </Space>
    </Card>
  );
};

// Purchase Points Section Component
interface PurchasePointsSectionProps {
  onPurchaseComplete: () => void;
  balance: { points: number; credits: number };
}

const PurchasePointsSection: React.FC<PurchasePointsSectionProps> = ({
  onPurchaseComplete,
  balance,
}) => {
  const [selectedPackage, setSelectedPackage] = useState(pointsPackages[0]);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      // Create payment intent
      const response = await fetch('/api/v1/points/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          points: selectedPackage.points,
          amount: selectedPackage.price,
          paymentMethod,
        }),
      });

      const { clientSecret } = await response.json();

      // Process payment based on method
      if (paymentMethod === 'stripe') {
        // Stripe payment flow
        message.info('Redirecting to Stripe payment...');
      } else {
        // PayPal payment flow
        message.info('Redirecting to PayPal...');
      }

      message.success('Purchase completed successfully!');
      onPurchaseComplete();
    } catch (error) {
      message.error('Purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card title="Purchase Points">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Text strong>Select Package</Text>
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            {pointsPackages.map((pkg) => (
              <Col key={pkg.points} xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  className={selectedPackage === pkg ? 'selected-package' : ''}
                  onClick={() => setSelectedPackage(pkg)}
                  style={{
                    border: selectedPackage === pkg ? '2px solid #1890ff' : undefined,
                  }}
                >
                  {pkg.popular && (
                    <Tag color="red" style={{ position: 'absolute', top: 8, right: 8 }}>
                      Popular
                    </Tag>
                  )}
                  <Statistic
                    title={`${(pkg.points / 1000).toFixed(0)}K Points`}
                    value={pkg.price}
                    prefix="$"
                  />
                  {pkg.discount && (
                    <Tag color="green" style={{ marginTop: 8 }}>
                      Save {pkg.discount}
                    </Tag>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <div>
          <Text strong>Payment Method</Text>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ marginTop: 8 }}
          >
            <Radio.Button value="stripe">
              <CreditCardOutlined /> Credit Card (Stripe)
            </Radio.Button>
            <Radio.Button value="paypal">
              <DollarOutlined /> PayPal
            </Radio.Button>
          </Radio.Group>
        </div>

        <Alert
          message={`You will receive ${selectedPackage.points.toLocaleString()} Points for $${selectedPackage.price}`}
          type="info"
          showIcon
        />

        <Button
          type="primary"
          size="large"
          icon={<ShoppingCartOutlined />}
          onClick={handlePurchase}
          loading={processing}
          block
        >
          Purchase for ${selectedPackage.price}
        </Button>
      </Space>
    </Card>
  );
};

// Exchange Rate Section Component
interface ExchangeRateSectionProps {
  currentRate: number;
  creditsBalance: number;
  onExchange: (credits: number) => Promise<void>;
}

const ExchangeRateSection: React.FC<ExchangeRateSectionProps> = ({
  currentRate,
  creditsBalance,
  onExchange,
}) => {
  const [creditsToExchange, setCreditsToExchange] = useState(1);
  const [exchanging, setExchanging] = useState(false);

  const pointsToReceive = creditsToExchange * currentRate;

  const handleExchange = async () => {
    if (creditsToExchange > creditsBalance) {
      message.error('Insufficient credits');
      return;
    }

    Modal.confirm({
      title: 'Confirm Exchange',
      content: (
        <div>
          <p>You are about to exchange:</p>
          <p>
            <strong>{creditsToExchange} Credits</strong> →{' '}
            <strong>{pointsToReceive.toLocaleString()} Points</strong>
          </p>
          <p>This action cannot be undone.</p>
        </div>
      ),
      onOk: async () => {
        setExchanging(true);
        try {
          await onExchange(creditsToExchange);
          message.success(
            `Exchanged ${creditsToExchange} Credits for ${pointsToReceive.toLocaleString()} Points`
          );
          setCreditsToExchange(1);
        } catch (error) {
          message.error('Exchange failed');
        } finally {
          setExchanging(false);
        }
      },
    });
  };

  return (
    <Card title="Exchange Credits to Points">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message={`Current Rate: 1 Credit = ${currentRate.toLocaleString()} Points`}
          type="info"
          showIcon
        />

        <div>
          <Text strong>Credits to Exchange</Text>
          <InputNumber
            min={1}
            max={creditsBalance}
            value={creditsToExchange}
            onChange={(value) => setCreditsToExchange(value || 1)}
            style={{ width: '100%', marginTop: 8 }}
            size="large"
          />
          <Text type="secondary">Available: {creditsBalance} Credits</Text>
        </div>

        <div>
          <Text strong>You will receive</Text>
          <Title level={2} style={{ margin: '8px 0' }}>
            {pointsToReceive.toLocaleString()} Points
          </Title>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<SwapOutlined />}
          onClick={handleExchange}
          loading={exchanging}
          disabled={creditsToExchange > creditsBalance}
          block
        >
          Exchange Now
        </Button>
      </Space>
    </Card>
  );
};

// Charts Section Component
interface ChartsSectionProps {
  balanceHistory: Array<{ date: string; points: number; credits: number }>;
  transactionTypes: Array<{ type: string; count: number; amount: number }>;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ balanceHistory, transactionTypes }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <Card title="Balance History (Last 30 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={balanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="points"
                stroke="#1890ff"
                name="Points"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="credits"
                stroke="#52c41a"
                name="Credits"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title="Transaction Types">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={transactionTypes}
                dataKey="amount"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {transactionTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

// Recent Transactions Section Component
interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  currency: 'points' | 'credits';
  date: string;
  description: string;
}

interface RecentTransactionsSectionProps {
  transactions: Transaction[];
}

const RecentTransactionsSection: React.FC<RecentTransactionsSectionProps> = ({ transactions }) => {
  const columns = [
    {
      title: 'Type',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Transaction) => (
        <Text type={record.type === 'credit' ? 'success' : 'danger'} strong>
          {record.type === 'credit' ? '+' : '-'}
          {amount.toLocaleString()} {record.currency}
        </Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <Card title="Recent Transactions" extra={<Button type="link">View All →</Button>}>
      <Table dataSource={transactions} columns={columns} pagination={false} size="small" />
    </Card>
  );
};

// Main Component
export const PointsCreditsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // RTK Query hooks
  const {
    data: walletData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useGetWalletBalanceQuery();
  const [exchangeCredits, { isLoading: exchangeLoading }] = useExchangeCreditsToPointsMutation();
  const [purchasePoints, { isLoading: purchaseLoading }] = usePurchasePointsMutation();
  const [claimDailyReward, { isLoading: claimLoading }] = useClaimDailyRewardMutation();

  const balance = walletData || { points: 0, credits: 0 };
  const exchangeRate = { creditToPointsRate: 1000, pointsToDollarRate: 10000 };
  const isLoading = balanceLoading || exchangeLoading || purchaseLoading || claimLoading;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data for now - in real implementation, fetch from APIs
      const mockData = {
        dailyReward: {
          canClaim: true,
          rewardAmount: 500,
          streak: 3,
          nextRewardTime: '23:45:12',
        },
        exchangeRate: {
          currentRate: 1000,
          creditsBalance: balance.credits,
        },
        charts: {
          balanceHistory: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            points: Math.floor(Math.random() * 50000) + 10000,
            credits: Math.floor(Math.random() * 100) + 50,
          })),
          transactionTypes: [
            { type: 'Purchase', count: 15, amount: 45000 },
            { type: 'Transfer', count: 8, amount: 12000 },
            { type: 'Reward', count: 25, amount: 12500 },
            { type: 'Exchange', count: 5, amount: 8000 },
          ],
        },
        recentTransactions: [
          {
            id: '1',
            type: 'credit',
            category: 'Daily Reward',
            amount: 500,
            currency: 'points',
            date: new Date().toISOString(),
            description: 'Daily login reward',
          },
          {
            id: '2',
            type: 'debit',
            category: 'Transfer',
            amount: 1000,
            currency: 'points',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            description: 'Transfer to user@example.com',
          },
          {
            id: '3',
            type: 'credit',
            category: 'Purchase',
            amount: 10000,
            currency: 'points',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            description: 'Points purchase',
          },
        ],
      };
      setData(mockData);
    } catch (error) {
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async (credits: number) => {
    try {
      await exchangeCredits({ creditAmount: credits }).unwrap();
      refetchBalance();
      fetchDashboardData();
    } catch (error: any) {
      throw new Error(error.data?.message || 'Exchange failed');
    }
  };

  const handleClaimReward = async () => {
    try {
      const result = await claimDailyReward().unwrap();
      refetchBalance();
      fetchDashboardData();
      return Promise.resolve();
    } catch (error: any) {
      throw new Error(error.data?.message || 'Claim failed');
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="points-credits-dashboard">
      <Row gutter={[16, 16]}>
        {/* Balance Cards */}
        <Col xs={24} sm={12} md={6}>
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
        <Col xs={24} sm={12} md={6}>
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
        <Col xs={24} sm={12} md={6}>
          <DailyRewardSection {...data.dailyReward} onClaim={handleClaimReward} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ExchangeRateSection
            currentRate={exchangeRate.creditToPointsRate}
            creditsBalance={balance.credits}
            onExchange={handleExchange}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <PurchasePointsSection onPurchaseComplete={fetchDashboardData} balance={balance} />
        </Col>
        <Col xs={24} lg={12}>
          <ChartsSection {...data.charts} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <RecentTransactionsSection transactions={data.recentTransactions} />
        </Col>
      </Row>
    </div>
  );
};
