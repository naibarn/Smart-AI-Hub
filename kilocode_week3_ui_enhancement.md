Enhance and complete existing UI Components for Smart AI Hub's Points System and Hierarchy Management.

# Task: Week 3 - UI Components Enhancement

## Objective

Enhance and complete 4 existing UI components (PointsCreditsDashboard, MemberList, TransferForm, ReferralCard) to provide comprehensive functionality and excellent user experience. All enhancements must integrate with existing APIs, follow React best practices, and maintain consistency with the overall design system.

## Context

Smart AI Hub has basic UI components that need to be enhanced with additional features to provide full functionality for the Points System and Multi-tier Hierarchy. This task will upgrade existing components to production-ready state with complete feature sets.

## Technology Stack

- **Framework:** React 18+ with TypeScript
- **UI Library:** Ant Design (antd)
- **State Management:** React Hooks
- **HTTP Client:** fetch API or axios
- **Charts:** recharts or Chart.js
- **QR Code:** qrcode.react
- **Icons:** @ant-design/icons
- **Payment:** Stripe React SDK (@stripe/react-stripe-js)

---

## Day 1: Points & Credits Dashboard Enhancement

### Task 1: Enhance PointsCreditsDashboard.tsx

**File:** `packages/frontend/src/components/points/PointsCreditsDashboard.tsx`

#### Current State

The component currently displays basic Points and Credits balances. It needs to be enhanced with comprehensive features for managing Points and Credits.

#### Features to Add

##### 1. Daily Rewards Section

**Requirements:**

- Display Daily Reward status (Claimed/Not Claimed today)
- Show reward amount (e.g., "500 Points")
- Show claim button (disabled if already claimed)
- Display streak counter (consecutive days)
- Show next reward time (countdown timer)
- Celebrate animation when claimed

**Implementation:**

```typescript
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
  onClaim
}) => {
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await onClaim();
      message.success(`Claimed ${rewardAmount} Points!`);
      // Show celebration animation
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
        <Statistic
          title="Current Streak"
          value={streak}
          suffix="days"
          prefix={<FireOutlined />}
        />
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
```

**API Integration:**

- `GET /api/v1/points/daily-reward/status` - Check claim status
- `POST /api/v1/points/daily-reward` - Claim reward

---

##### 2. Purchase Points Section

**Requirements:**

- Form to select Points package
- Display pricing (10,000 Points = 1 USD)
- Multiple package options (10K, 50K, 100K, 500K, 1M Points)
- Payment method selection (Stripe, PayPal)
- Payment integration
- Receipt generation
- Transaction confirmation

**Implementation:**

```typescript
interface PurchasePointsSectionProps {
  onPurchaseComplete: () => void;
}

const pointsPackages = [
  { points: 10000, price: 1, popular: false },
  { points: 50000, price: 4.5, popular: true, discount: '10%' },
  { points: 100000, price: 8, popular: false, discount: '20%' },
  { points: 500000, price: 35, popular: false, discount: '30%' },
  { points: 1000000, price: 60, popular: false, discount: '40%' }
];

const PurchasePointsSection: React.FC<PurchasePointsSectionProps> = ({
  onPurchaseComplete
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          points: selectedPackage.points,
          amount: selectedPackage.price,
          paymentMethod
        })
      });

      const { clientSecret } = await response.json();

      // Process payment based on method
      if (paymentMethod === 'stripe') {
        // Stripe payment flow
      } else {
        // PayPal payment flow
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
          <Typography.Text strong>Select Package</Typography.Text>
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            {pointsPackages.map(pkg => (
              <Col key={pkg.points} xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  className={selectedPackage === pkg ? 'selected-package' : ''}
                  onClick={() => setSelectedPackage(pkg)}
                  style={{
                    border: selectedPackage === pkg ? '2px solid #1890ff' : undefined
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
          <Typography.Text strong>Payment Method</Typography.Text>
          <Radio.Group
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
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
```

**API Integration:**

- `POST /api/v1/points/purchase` - Create purchase order
- Stripe/PayPal SDK integration

---

##### 3. Exchange Rate Section

**Requirements:**

- Display current exchange rate (1 Credit = X Points)
- Calculator to preview exchange
- Exchange button
- Confirmation dialog
- Balance validation
- Transaction history link

**Implementation:**

```typescript
interface ExchangeRateSectionProps {
  currentRate: number; // e.g., 1000 (1 Credit = 1000 Points)
  creditsBalance: number;
  onExchange: (credits: number) => Promise<void>;
}

const ExchangeRateSection: React.FC<ExchangeRateSectionProps> = ({
  currentRate,
  creditsBalance,
  onExchange
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
          <p><strong>{creditsToExchange} Credits</strong> → <strong>{pointsToReceive.toLocaleString()} Points</strong></p>
          <p>This action cannot be undone.</p>
        </div>
      ),
      onOk: async () => {
        setExchanging(true);
        try {
          await onExchange(creditsToExchange);
          message.success(`Exchanged ${creditsToExchange} Credits for ${pointsToReceive.toLocaleString()} Points`);
          setCreditsToExchange(1);
        } catch (error) {
          message.error('Exchange failed');
        } finally {
          setExchanging(false);
        }
      }
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
          <Typography.Text strong>Credits to Exchange</Typography.Text>
          <InputNumber
            min={1}
            max={creditsBalance}
            value={creditsToExchange}
            onChange={value => setCreditsToExchange(value || 1)}
            style={{ width: '100%', marginTop: 8 }}
            size="large"
          />
          <Typography.Text type="secondary">
            Available: {creditsBalance} Credits
          </Typography.Text>
        </div>

        <div>
          <Typography.Text strong>You will receive</Typography.Text>
          <Typography.Title level={2} style={{ margin: '8px 0' }}>
            {pointsToReceive.toLocaleString()} Points
          </Typography.Title>
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
```

**API Integration:**

- `GET /api/v1/exchange-rate` - Get current rate
- `POST /api/v1/points/exchange` - Exchange credits to points

---

##### 4. Charts Section

**Requirements:**

- Balance History Line Chart (last 30 days)
- Transaction Types Pie Chart
- Responsive design
- Interactive tooltips
- Legend

**Implementation:**

```typescript
interface ChartsSection Props {
  balanceHistory: Array<{ date: string; points: number; credits: number }>;
  transactionTypes: Array<{ type: string; count: number; amount: number }>;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({
  balanceHistory,
  transactionTypes
}) => {
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
```

---

##### 5. Recent Transactions Section

**Requirements:**

- Display 10 most recent transactions
- Show type, amount, date
- Color-coded by type (credit/debit)
- Link to full history page

**Implementation:**

```typescript
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

const RecentTransactionsSection: React.FC<RecentTransactionsSectionProps> = ({
  transactions
}) => {
  const columns = [
    {
      title: 'Type',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag>{text}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Transaction) => (
        <Typography.Text
          type={record.type === 'credit' ? 'success' : 'danger'}
          strong
        >
          {record.type === 'credit' ? '+' : '-'}{amount.toLocaleString()} {record.currency}
        </Typography.Text>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    }
  ];

  return (
    <Card
      title="Recent Transactions"
      extra={<Link to="/points/history">View All →</Link>}
    >
      <Table
        dataSource={transactions}
        columns={columns}
        pagination={false}
        size="small"
      />
    </Card>
  );
};
```

---

#### Complete Enhanced Component Structure

```typescript
export const PointsCreditsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch all data
  };

  return (
    <div className="points-credits-dashboard">
      <Row gutter={[16, 16]}>
        {/* Balance Cards */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Points Balance" value={data?.points} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Credits Balance" value={data?.credits} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <DailyRewardSection {...data?.dailyReward} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ExchangeRateSection {...data?.exchangeRate} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <PurchasePointsSection onPurchaseComplete={fetchDashboardData} />
        </Col>
        <Col xs={24} lg={12}>
          <ChartsSection {...data?.charts} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <RecentTransactionsSection transactions={data?.recentTransactions} />
        </Col>
      </Row>
    </div>
  );
};
```

**Deliverable:**

- ✅ Fully enhanced PointsCreditsDashboard component
- ✅ All 5 sections implemented
- ✅ API integration complete
- ✅ Responsive design
- ✅ Payment integration (Stripe/PayPal)

---

## Day 2: Member List Enhancement

### Task 2: Enhance MemberList.tsx

**File:** `packages/frontend/src/components/MemberList.tsx`

#### Current State

Basic table showing members. Needs advanced filtering, sorting, bulk actions, and export functionality.

#### Features to Add

##### 1. Filters

**Requirements:**

- Filter by Tier (multi-select)
- Filter by Status (Active/Blocked)
- Search by Name/Email
- Clear filters button

**Implementation:**

```typescript
interface MemberFilters {
  tiers: string[];
  status: 'all' | 'active' | 'blocked';
  search: string;
}

const FilterSection: React.FC<{
  filters: MemberFilters;
  onChange: (filters: MemberFilters) => void;
}> = ({ filters, onChange }) => {
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Typography.Text strong>Tier</Typography.Text>
          <Select
            mode="multiple"
            placeholder="Select tiers"
            value={filters.tiers}
            onChange={tiers => onChange({ ...filters, tiers })}
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
          <Typography.Text strong>Status</Typography.Text>
          <Radio.Group
            value={filters.status}
            onChange={e => onChange({ ...filters, status: e.target.value })}
            style={{ marginTop: 8 }}
          >
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="active">Active</Radio.Button>
            <Radio.Button value="blocked">Blocked</Radio.Button>
          </Radio.Group>
        </div>

        <div>
          <Typography.Text strong>Search</Typography.Text>
          <Input.Search
            placeholder="Search by name or email"
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            style={{ marginTop: 8 }}
            allowClear
          />
        </div>

        <Button
          onClick={() => onChange({ tiers: [], status: 'all', search: '' })}
          block
        >
          Clear Filters
        </Button>
      </Space>
    </Card>
  );
};
```

---

##### 2. Sorting

**Requirements:**

- Sort by Name (A-Z, Z-A)
- Sort by Tier
- Sort by Points (High-Low, Low-High)
- Sort by Credits (High-Low, Low-High)
- Sort by Join Date (Newest-Oldest, Oldest-Newest)

**Implementation:**

```typescript
const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
    render: (name, record) => (
      <Space>
        <Avatar src={record.avatar}>{name[0]}</Avatar>
        <div>
          <Typography.Text strong>{name}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Typography.Text>
        </div>
      </Space>
    )
  },
  {
    title: 'Tier',
    dataIndex: 'tier',
    key: 'tier',
    sorter: (a, b) => tierOrder[a.tier] - tierOrder[b.tier],
    render: (tier) => <TierBadge tier={tier} />
  },
  {
    title: 'Points',
    dataIndex: 'points',
    key: 'points',
    sorter: (a, b) => a.points - b.points,
    render: (points) => points.toLocaleString()
  },
  {
    title: 'Credits',
    dataIndex: 'credits',
    key: 'credits',
    sorter: (a, b) => a.credits - b.credits,
    render: (credits) => credits.toLocaleString()
  },
  {
    title: 'Join Date',
    dataIndex: 'joinDate',
    key: 'joinDate',
    sorter: (a, b) => new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime(),
    render: (date) => new Date(date).toLocaleDateString()
  },
  {
    title: 'Status',
    dataIndex: 'isBlocked',
    key: 'status',
    render: (isBlocked) => (
      <Tag color={isBlocked ? 'red' : 'green'}>
        {isBlocked ? 'Blocked' : 'Active'}
      </Tag>
    )
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button size="small" onClick={() => handleViewDetails(record)}>
          View
        </Button>
        <Button size="small" onClick={() => handleTransfer(record)}>
          Transfer
        </Button>
        <Button
          size="small"
          danger={!record.isBlocked}
          onClick={() => handleBlock(record)}
        >
          {record.isBlocked ? 'Unblock' : 'Block'}
        </Button>
      </Space>
    )
  }
];
```

---

##### 3. Bulk Actions

**Requirements:**

- Select multiple members (checkboxes)
- Bulk block/unblock
- Bulk transfer
- Select all/Deselect all

**Implementation:**

```typescript
const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

const rowSelection = {
  selectedRowKeys,
  onChange: (keys: React.Key[]) => setSelectedRowKeys(keys)
};

const handleBulkBlock = async () => {
  Modal.confirm({
    title: `Block ${selectedRowKeys.length} members?`,
    content: 'Selected members will not be able to access the system.',
    onOk: async () => {
      try {
        await fetch('/api/v1/bulk/block', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ userIds: selectedRowKeys })
        });
        message.success('Members blocked successfully');
        setSelectedRowKeys([]);
        fetchMembers();
      } catch (error) {
        message.error('Failed to block members');
      }
    }
  });
};

const handleBulkTransfer = () => {
  // Open transfer modal with selected members
};

const BulkActionsBar = () => (
  <Space style={{ marginBottom: 16 }}>
    <Typography.Text>{selectedRowKeys.length} selected</Typography.Text>
    <Button onClick={handleBulkBlock}>Block Selected</Button>
    <Button onClick={handleBulkUnblock}>Unblock Selected</Button>
    <Button onClick={handleBulkTransfer}>Transfer to Selected</Button>
    <Button onClick={() => setSelectedRowKeys([])}>Clear Selection</Button>
  </Space>
);
```

---

##### 4. Export

**Requirements:**

- Export to CSV
- Export to Excel
- Export filtered/selected data only
- Include all columns

**Implementation:**

```typescript
const handleExportCSV = () => {
  const dataToExport = selectedRowKeys.length > 0
    ? members.filter(m => selectedRowKeys.includes(m.id))
    : filteredMembers;

  const csv = [
    ['Name', 'Email', 'Tier', 'Points', 'Credits', 'Status', 'Join Date'],
    ...dataToExport.map(m => [
      m.name,
      m.email,
      m.tier,
      m.points,
      m.credits,
      m.isBlocked ? 'Blocked' : 'Active',
      new Date(m.joinDate).toLocaleDateString()
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `members_${new Date().toISOString()}.csv`;
  link.click();
};

const handleExportExcel = async () => {
  // Use library like xlsx to generate Excel file
};

const ExportButtons = () => (
  <Space>
    <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
      Export CSV
    </Button>
    <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
      Export Excel
    </Button>
  </Space>
);
```

---

##### 5. Enhanced Pagination

**Requirements:**

- Configurable page size (10, 20, 50, 100)
- Jump to page
- Show total count
- Page size selector

**Implementation:**

```typescript
const [pagination, setPagination] = useState({
  current: 1,
  pageSize: 20,
  total: 0,
});

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
```

---

#### Complete Enhanced Component

```typescript
export const MemberList: React.FC = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MemberFilters>({
    tiers: [],
    status: 'all',
    search: ''
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // Apply filters
      if (filters.tiers.length > 0 && !filters.tiers.includes(member.tier)) return false;
      if (filters.status !== 'all' && member.isBlocked !== (filters.status === 'blocked')) return false;
      if (filters.search && !member.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !member.email.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [members, filters]);

  return (
    <div className="member-list">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <FilterSection filters={filters} onChange={setFilters} />
        </Col>
        <Col xs={24} md={18}>
          <Card
            title="Members"
            extra={<ExportButtons />}
          >
            {selectedRowKeys.length > 0 && <BulkActionsBar />}
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={filteredMembers}
              loading={loading}
              pagination={paginationConfig}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

**Deliverable:**

- ✅ Fully enhanced MemberList component
- ✅ Advanced filtering
- ✅ Sorting on all columns
- ✅ Bulk actions
- ✅ Export functionality
- ✅ Enhanced pagination

---

## Day 3: Transfer Form Enhancement

### Task 3: Enhance TransferForm.tsx

**File:** `packages/frontend/src/components/transfer/TransferForm.tsx`

#### Features to Add

##### 1. User Search/Autocomplete

**Requirements:**

- Search by name or email
- Autocomplete dropdown
- **Filtered by Visibility Rules** ⭐ Critical
- Show avatar, name, email, tier
- Recent recipients

**Implementation:**

```typescript
const [searchResults, setSearchResults] = useState([]);
const [recentRecipients, setRecentRecipients] = useState([]);

const handleSearch = async (value: string) => {
  if (value.length < 2) return;

  try {
    const response = await fetch(`/api/v1/users/search?q=${encodeURIComponent(value)}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    // Results are already filtered by visibility rules on backend
    setSearchResults(data.users);
  } catch (error) {
    message.error('Search failed');
  }
};

<AutoComplete
  style={{ width: '100%' }}
  onSearch={handleSearch}
  onSelect={handleSelectRecipient}
  placeholder="Search by name or email"
>
  {searchResults.map(user => (
    <AutoComplete.Option key={user.id} value={user.id}>
      <Space>
        <Avatar src={user.avatar}>{user.name[0]}</Avatar>
        <div>
          <Typography.Text strong>{user.name}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {user.email}
          </Typography.Text>
        </div>
        <TierBadge tier={user.tier} size="small" />
      </Space>
    </AutoComplete.Option>
  ))}
</AutoComplete>
```

**API Integration:**

- `GET /api/v1/users/search?q={query}` - Search users (with visibility filtering)

---

##### 2. Enhanced Validation

**Requirements:**

- Check sufficient balance
- Check minimum amount (e.g., 1 Point/Credit)
- Check authorization (can transfer to this user?)
- Real-time validation feedback

**Implementation:**

```typescript
const validateTransfer = async (recipient: User, amount: number, type: 'points' | 'credits') => {
  const errors = [];

  // Check balance
  const currentBalance = type === 'points' ? pointsBalance : creditsBalance;
  if (amount > currentBalance) {
    errors.push(`Insufficient ${type}. You have ${currentBalance} ${type}.`);
  }

  // Check minimum amount
  if (amount < 1) {
    errors.push('Amount must be at least 1');
  }

  // Check authorization
  try {
    const response = await fetch('/api/v1/transfer/check-authorization', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ recipientId: recipient.id }),
    });
    const { authorized, reason } = await response.json();
    if (!authorized) {
      errors.push(reason || 'You are not authorized to transfer to this user');
    }
  } catch (error) {
    errors.push('Authorization check failed');
  }

  return errors;
};
```

---

##### 3. Confirmation Dialog

**Requirements:**

- Show transfer details
- Show recipient info
- Show amount and type
- Confirm before submit
- Cancel option

**Implementation:**

```typescript
const showConfirmDialog = () => {
  Modal.confirm({
    title: 'Confirm Transfer',
    icon: <ExclamationCircleOutlined />,
    content: (
      <div>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Recipient">
            <Space>
              <Avatar src={recipient.avatar}>{recipient.name[0]}</Avatar>
              <div>
                <Typography.Text strong>{recipient.name}</Typography.Text>
                <br />
                <Typography.Text type="secondary">{recipient.email}</Typography.Text>
              </div>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Amount">
            <Typography.Text strong style={{ fontSize: 18 }}>
              {amount.toLocaleString()} {transferType === 'points' ? 'Points' : 'Credits'}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Your Balance After">
            {(currentBalance - amount).toLocaleString()} {transferType === 'points' ? 'Points' : 'Credits'}
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
    onOk: handleTransfer
  });
};
```

---

##### 4. Success/Error Messages

**Requirements:**

- Success notification with details
- Error handling with clear messages
- Transaction ID display
- Link to transaction history

**Implementation:**

```typescript
const handleTransfer = async () => {
  try {
    const response = await fetch('/api/v1/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        recipientId: recipient.id,
        amount,
        type: transferType
      })
    });

    const data = await response.json();

    if (response.ok) {
      notification.success({
        message: 'Transfer Successful',
        description: (
          <div>
            <p>Transferred {amount.toLocaleString()} {transferType} to {recipient.name}</p>
            <p>Transaction ID: {data.transactionId}</p>
            <Link to="/transfer/history">View History →</Link>
          </div>
        ),
        duration: 5
      });
      onSuccess();
    } else {
      throw new Error(data.message || 'Transfer failed');
    }
  } catch (error) {
    notification.error({
      message: 'Transfer Failed',
      description: error.message || 'An error occurred during transfer',
      duration: 5
    });
  }
};
```

---

##### 5. Transfer History

**Requirements:**

- Show recent transfers (last 5)
- Link to full history page
- Quick repeat transfer

**Implementation:**

```typescript
const RecentTransfers: React.FC<{ transfers: Transfer[] }> = ({ transfers }) => {
  return (
    <Card
      title="Recent Transfers"
      extra={<Link to="/transfer/history">View All →</Link>}
      size="small"
    >
      <List
        dataSource={transfers}
        renderItem={transfer => (
          <List.Item
            actions={[
              <Button
                size="small"
                onClick={() => handleRepeatTransfer(transfer)}
              >
                Repeat
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={transfer.recipient.avatar}>{transfer.recipient.name[0]}</Avatar>}
              title={transfer.recipient.name}
              description={`${transfer.amount.toLocaleString()} ${transfer.type} • ${new Date(transfer.date).toLocaleDateString()}`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
```

---

#### Complete Enhanced Component

```typescript
export const TransferForm: React.FC = () => {
  const [recipient, setRecipient] = useState<User | null>(null);
  const [amount, setAmount] = useState(0);
  const [transferType, setTransferType] = useState<'points' | 'credits'>('points');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [recentTransfers, setRecentTransfers] = useState([]);

  const handleSubmit = async () => {
    const errors = await validateTransfer(recipient, amount, transferType);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    showConfirmDialog();
  };

  return (
    <div className="transfer-form">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Transfer Points or Credits">
            <Form layout="vertical" onFinish={handleSubmit}>
              <Form.Item label="Recipient" required>
                <UserSearchAutocomplete
                  onSelect={setRecipient}
                  selected={recipient}
                />
              </Form.Item>

              <Form.Item label="Type" required>
                <Radio.Group value={transferType} onChange={e => setTransferType(e.target.value)}>
                  <Radio.Button value="points">Points</Radio.Button>
                  <Radio.Button value="credits">Credits</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item label="Amount" required>
                <InputNumber
                  min={1}
                  value={amount}
                  onChange={setAmount}
                  style={{ width: '100%' }}
                  size="large"
                />
                <Typography.Text type="secondary">
                  Available: {transferType === 'points' ? pointsBalance : creditsBalance} {transferType}
                </Typography.Text>
              </Form.Item>

              {validationErrors.length > 0 && (
                <Alert
                  message="Validation Errors"
                  description={
                    <ul>
                      {validationErrors.map((error, i) => <li key={i}>{error}</li>)}
                    </ul>
                  }
                  type="error"
                  showIcon
                  closable
                />
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SendOutlined />}
                  block
                >
                  Transfer
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
```

**Deliverable:**

- ✅ Fully enhanced TransferForm component
- ✅ User search with visibility filtering
- ✅ Comprehensive validation
- ✅ Confirmation dialog
- ✅ Success/error handling
- ✅ Recent transfers

---

## Day 4: Referral Card Enhancement

### Task 4: Enhance ReferralCard.tsx

**File:** `packages/frontend/src/components/referral/ReferralCard.tsx`

#### Features to Add

##### 1. QR Code

**Requirements:**

- Generate QR Code from invite link
- Download QR Code as image
- Customizable size
- High error correction

**Implementation:**

```typescript
import QRCode from 'qrcode.react';

const QRCodeSection: React.FC<{ inviteLink: string }> = ({ inviteLink }) => {
  const downloadQRCode = () => {
    const canvas = document.getElementById('referral-qr-code') as HTMLCanvasElement;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'invite-qr-code.png';
    link.href = url;
    link.click();
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <QRCode
        id="referral-qr-code"
        value={inviteLink}
        size={200}
        level="H"
        includeMargin
      />
      <br />
      <Button
        icon={<DownloadOutlined />}
        onClick={downloadQRCode}
        style={{ marginTop: 8 }}
      >
        Download QR Code
      </Button>
    </div>
  );
};
```

---

##### 2. Social Share Buttons

**Requirements:**

- Facebook, Twitter, Line, Email, WhatsApp
- Custom share message
- Popup windows
- Share tracking (optional)

**Implementation:**

```typescript
const SocialShareSection: React.FC<{ inviteLink: string }> = ({ inviteLink }) => {
  const shareMessage = 'Join Smart AI Hub using my invite link!';

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(inviteLink)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteLink)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareViaEmail = () => {
    window.location.href = `mailto:?subject=Join Smart AI Hub&body=${encodeURIComponent(shareMessage + '\n\n' + inviteLink)}`;
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + inviteLink)}`,
      '_blank'
    );
  };

  return (
    <Space wrap>
      <Button
        icon={<FacebookOutlined />}
        onClick={shareOnFacebook}
        style={{ backgroundColor: '#1877F2', color: 'white' }}
      >
        Facebook
      </Button>
      <Button
        icon={<TwitterOutlined />}
        onClick={shareOnTwitter}
        style={{ backgroundColor: '#1DA1F2', color: 'white' }}
      >
        Twitter
      </Button>
      <Button
        onClick={shareOnLine}
        style={{ backgroundColor: '#00B900', color: 'white' }}
      >
        Line
      </Button>
      <Button icon={<MailOutlined />} onClick={shareViaEmail}>
        Email
      </Button>
      <Button
        icon={<WhatsAppOutlined />}
        onClick={shareOnWhatsApp}
        style={{ backgroundColor: '#25D366', color: 'white' }}
      >
        WhatsApp
      </Button>
    </Space>
  );
};
```

---

##### 3. Statistics

**Requirements:**

- Total Referrals count
- Active Referrals count
- Total Rewards earned
- Visual indicators (icons, colors)

**Implementation:**

```typescript
const StatisticsSection: React.FC<{
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
}> = ({ totalReferrals, activeReferrals, totalRewards }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Statistic
          title="Total Referrals"
          value={totalReferrals}
          prefix={<UserAddOutlined />}
          valueStyle={{ color: '#1890ff' }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="Active Referrals"
          value={activeReferrals}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#52c41a' }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="Total Rewards"
          value={totalRewards}
          prefix={<TrophyOutlined />}
          suffix="Points"
          valueStyle={{ color: '#faad14' }}
        />
      </Col>
    </Row>
  );
};
```

---

##### 4. Copy Link Button

**Requirements:**

- One-click copy
- Success notification
- Visual feedback

**Implementation:**

```typescript
const CopyLinkButton: React.FC<{ inviteLink: string }> = ({ inviteLink }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    message.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="primary"
      icon={copied ? <CheckOutlined /> : <CopyOutlined />}
      onClick={handleCopy}
      size="large"
      block
    >
      {copied ? 'Copied!' : 'Copy Invite Link'}
    </Button>
  );
};
```

---

#### Complete Enhanced Component

```typescript
export const ReferralCard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    // Fetch data from API
  };

  if (loading) return <Spin />;

  return (
    <div className="referral-card">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Your Invite Code">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ textAlign: 'center' }}>
                <Typography.Title level={1}>{data.inviteCode}</Typography.Title>
              </div>
              <CopyLinkButton inviteLink={data.inviteLink} />
              <Divider />
              <QRCodeSection inviteLink={data.inviteLink} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Referral Statistics">
            <StatisticsSection
              totalReferrals={data.totalReferrals}
              activeReferrals={data.activeReferrals}
              totalRewards={data.totalRewards}
            />
          </Card>

          <Card title="Share Your Link" style={{ marginTop: 16 }}>
            <SocialShareSection inviteLink={data.inviteLink} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

**Deliverable:**

- ✅ Fully enhanced ReferralCard component
- ✅ QR Code generation and download
- ✅ Social share buttons (5 platforms)
- ✅ Statistics display
- ✅ Copy link functionality

---

## Quality Standards

### Code Quality

- ✅ TypeScript with proper types
- ✅ React Hooks best practices
- ✅ Error handling
- ✅ Loading states
- ✅ Input validation
- ✅ Responsive design
- ✅ Accessibility (a11y)

### UI/UX

- ✅ Consistent with Ant Design
- ✅ Mobile-friendly
- ✅ Fast and smooth
- ✅ Clear feedback
- ✅ Intuitive interactions

### Security

- ✅ Visibility rules enforced
- ✅ Authorization checks
- ✅ Input sanitization
- ✅ Secure API calls

---

## Success Criteria (Week 3)

The Week 3 task is considered complete when:

- ✅ PointsCreditsDashboard fully enhanced (5 sections)
- ✅ MemberList fully enhanced (filters, sorting, bulk actions, export)
- ✅ TransferForm fully enhanced (search, validation, confirmation)
- ✅ ReferralCard fully enhanced (QR, social share, statistics)
- ✅ All components use TypeScript
- ✅ All components are responsive
- ✅ API integration complete
- ✅ Error handling implemented
- ✅ User experience excellent
- ✅ Features complete as per spec

---

## Deliverables Summary

### Enhanced Components (4)

1. ✅ `PointsCreditsDashboard.tsx` - Complete dashboard with 5 sections
2. ✅ `MemberList.tsx` - Advanced table with filters, sorting, bulk actions
3. ✅ `TransferForm.tsx` - Complete form with validation and confirmation
4. ✅ `ReferralCard.tsx` - Complete card with QR, social share, statistics

---

## Instructions for Kilo Code

1. **Read existing components** to understand current implementation
2. **Install dependencies** if needed (qrcode.react, xlsx for Excel export)
3. **Enhance each component** following the specifications
4. **Integrate with APIs** with proper error handling
5. **Test all features** for functionality and responsiveness
6. **Ensure TypeScript** types are correct
7. **Follow Ant Design** patterns
8. **Maintain consistency** with existing code style

---

## Notes

- This is a frontend enhancement task
- Do NOT modify backend code
- Do NOT break existing functionality
- Enhance components incrementally
- Test each feature after implementation
- Focus on user experience
- Ensure all features work together seamlessly

---

## Expected Timeline

- **Day 1:** PointsCreditsDashboard (6-8 hours)
- **Day 2:** MemberList (6-8 hours)
- **Day 3:** TransferForm (4-6 hours)
- **Day 4:** ReferralCard (3-4 hours)
- **Total:** ~19-26 hours of work

---

## Output

Please enhance all 4 components as specified. Confirm when complete and ready for testing.
