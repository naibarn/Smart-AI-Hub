Create comprehensive Frontend Pages and Components for Smart AI Hub's Multi-tier Hierarchy and Referral System.

# Task: Week 2 - Frontend Pages and Components Development

## Objective
Create 3 new pages and 8 new components for Smart AI Hub's frontend to support the Multi-tier Hierarchy and Referral System. All components must follow React best practices, use TypeScript, integrate with existing APIs, and provide excellent user experience.

## Context
Smart AI Hub has a complete backend implementation for the Multi-tier Hierarchy and Referral System. The frontend currently has basic components but is missing key pages and components for users to fully utilize these features. This task will create the missing frontend elements to complete the user interface.

## Technology Stack
- **Framework:** React 18+ with TypeScript
- **UI Library:** Ant Design (antd)
- **State Management:** React Hooks (useState, useEffect, useContext)
- **HTTP Client:** fetch API or axios
- **Routing:** React Router v6
- **Charts:** recharts or Chart.js
- **QR Code:** qrcode.react
- **Icons:** @ant-design/icons

## Project Structure
```
packages/frontend/src/
├── components/
│   ├── guards/
│   │   └── RouteGuard.tsx (existing)
│   ├── points/
│   │   └── PointsCreditsDashboard.tsx (existing)
│   ├── referral/
│   │   ├── ReferralCard.tsx (existing)
│   │   ├── ReferralStatistics.tsx (NEW)
│   │   ├── ReferralList.tsx (NEW)
│   │   └── ReferralRewardsHistory.tsx (NEW)
│   ├── invite/
│   │   ├── QRCodeGenerator.tsx (NEW)
│   │   ├── InviteCodeCard.tsx (NEW)
│   │   └── SocialShareButtons.tsx (NEW)
│   ├── agency/
│   │   ├── AgencyRewardSettings.tsx (NEW)
│   │   └── RewardStatistics.tsx (NEW)
│   ├── hierarchy/
│   │   ├── HierarchyTree.tsx (NEW)
│   │   └── TierBadge.tsx (NEW)
│   ├── transfer/
│   │   └── TransferForm.tsx (existing)
│   └── MemberList.tsx (existing)
├── pages/
│   ├── Referrals.tsx (NEW)
│   ├── Invite.tsx (NEW)
│   ├── agency/
│   │   └── AgencySettings.tsx (NEW)
│   ├── members/
│   │   └── MembersPage.tsx (existing)
│   ├── transfer/
│   │   └── TransferPage.tsx (existing)
│   └── Points.tsx (existing)
└── hooks/
    ├── useAuth.tsx (existing)
    ├── useReferral.tsx (NEW)
    └── useHierarchy.tsx (NEW)
```

---

## Part 1: Referrals & Invite Pages (Day 1-2)

### Task 1.1: Create Referrals Page

**File:** `packages/frontend/src/pages/Referrals.tsx`

#### Features
1. Display Referral Statistics (Total Referrals, Active Referrals, Total Rewards)
2. Display list of referred users (Table with pagination)
3. Display Rewards history
4. Charts showing referrals over time

#### Implementation Requirements

```typescript
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spin } from 'antd';
import { ReferralStatistics } from '../components/referral/ReferralStatistics';
import { ReferralList } from '../components/referral/ReferralList';
import { ReferralRewardsHistory } from '../components/referral/ReferralRewardsHistory';

export const Referrals: React.FC = () => {
  // Component implementation
};
```

**Layout:**
- Top section: Statistics cards (3 cards in a row)
- Middle section: Referrals chart
- Bottom left: Referred users table
- Bottom right: Rewards history

**API Integration:**
- `GET /api/v1/referral/stats` - Get referral statistics
- `GET /api/v1/referral/list` - Get list of referred users
- `GET /api/v1/referral/rewards` - Get rewards history

**Deliverable:**
- ✅ Fully functional Referrals page
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states

---

### Task 1.2: Create ReferralStatistics Component

**File:** `packages/frontend/src/components/referral/ReferralStatistics.tsx`

#### Features
- Display Total Referrals count
- Display Active Referrals count
- Display Total Rewards earned
- Display chart showing referrals over time (last 30 days)

#### Implementation Requirements

```typescript
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
  // Component implementation
};
```

**Design:**
- 3 statistic cards with icons
- Line chart below statistics
- Color-coded (blue, green, gold)
- Animated numbers

**Deliverable:**
- ✅ ReferralStatistics component
- ✅ Chart integration
- ✅ Responsive design
- ✅ TypeScript types

---

### Task 1.3: Create ReferralList Component

**File:** `packages/frontend/src/components/referral/ReferralList.tsx`

#### Features
- Display table of referred users
- Columns: Name, Email, Tier, Signup Date, Status, Reward
- Pagination (20 per page)
- Sorting by columns
- Search by name/email

#### Implementation Requirements

```typescript
import React, { useState, useEffect } from 'react';
import { Table, Tag, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { TierBadge } from '../hierarchy/TierBadge';

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
  // Component implementation
};
```

**Table Columns:**
1. Name (with avatar)
2. Email
3. Tier (using TierBadge component)
4. Signup Date (formatted)
5. Status (Tag: Active/Blocked)
6. Reward (Points earned)

**Deliverable:**
- ✅ ReferralList component
- ✅ Table with sorting
- ✅ Search functionality
- ✅ Pagination
- ✅ TypeScript types

---

### Task 1.4: Create ReferralRewardsHistory Component

**File:** `packages/frontend/src/components/referral/ReferralRewardsHistory.tsx`

#### Features
- Display timeline of rewards received
- Show reward amount, date, and referred user
- Pagination
- Total rewards summary

#### Implementation Requirements

```typescript
import React from 'react';
import { Timeline, Card, Typography, Space } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';

interface RewardHistoryItem {
  id: string;
  amount: number;
  date: string;
  referredUserName: string;
  referredUserTier: string;
}

interface ReferralRewardsHistoryProps {
  rewards: RewardHistoryItem[];
  totalRewards: number;
}

export const ReferralRewardsHistory: React.FC<ReferralRewardsHistoryProps> = ({
  rewards,
  totalRewards
}) => {
  // Component implementation
};
```

**Design:**
- Timeline layout
- Each item shows: Amount, Date, User name
- Color-coded by tier
- Summary card at top

**Deliverable:**
- ✅ ReferralRewardsHistory component
- ✅ Timeline design
- ✅ Summary section
- ✅ TypeScript types

---

### Task 1.5: Create Invite Page

**File:** `packages/frontend/src/pages/Invite.tsx`

#### Features
1. Display Invite Code (large, prominent)
2. Display Invite Link with Copy button
3. Display QR Code (scannable)
4. Social Share Buttons (Facebook, Twitter, Line, Email)
5. Instructions on how to use Invite Code

#### Implementation Requirements

```typescript
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, message, Spin } from 'antd';
import { InviteCodeCard } from '../components/invite/InviteCodeCard';
import { QRCodeGenerator } from '../components/invite/QRCodeGenerator';
import { SocialShareButtons } from '../components/invite/SocialShareButtons';

export const Invite: React.FC = () => {
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch invite code from API
  // Generate invite link

  return (
    <div className="invite-page">
      <Typography.Title level={2}>Invite Friends</Typography.Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <InviteCodeCard code={inviteCode} link={inviteLink} />
        </Col>
        <Col xs={24} md={12}>
          <QRCodeGenerator value={inviteLink} />
        </Col>
      </Row>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <SocialShareButtons link={inviteLink} />
        </Col>
      </Row>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="How to Use Invite Code">
            {/* Instructions */}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

**API Integration:**
- `GET /api/v1/referral/invite-code` - Get user's invite code
- `POST /api/v1/referral/regenerate-code` - Regenerate invite code (optional)

**Deliverable:**
- ✅ Fully functional Invite page
- ✅ Responsive design
- ✅ Copy to clipboard functionality
- ✅ Social sharing integration

---

### Task 1.6: Create QRCodeGenerator Component

**File:** `packages/frontend/src/components/invite/QRCodeGenerator.tsx`

#### Features
- Generate QR Code from invite link
- Download QR Code as image
- Customizable size
- Error correction level

#### Implementation Requirements

```typescript
import React from 'react';
import { Card, Button, Space } from 'antd';
import { DownloadOutlined, QrcodeOutlined } from '@ant-design/icons';
import QRCode from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 256
}) => {
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'invite-qr-code.png';
    link.href = url;
    link.click();
  };

  return (
    <Card
      title={<><QrcodeOutlined /> QR Code</>}
      extra={
        <Button icon={<DownloadOutlined />} onClick={downloadQRCode}>
          Download
        </Button>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <QRCode
          id="qr-code"
          value={value}
          size={size}
          level="H"
          includeMargin
        />
      </div>
    </Card>
  );
};
```

**Deliverable:**
- ✅ QRCodeGenerator component
- ✅ Download functionality
- ✅ High error correction
- ✅ TypeScript types

---

### Task 1.7: Create InviteCodeCard Component

**File:** `packages/frontend/src/components/invite/InviteCodeCard.tsx`

#### Features
- Display invite code (large font)
- Display invite link
- Copy code button
- Copy link button
- Regenerate code button (optional)

#### Implementation Requirements

```typescript
import React from 'react';
import { Card, Typography, Button, Space, message } from 'antd';
import { CopyOutlined, ReloadOutlined, LinkOutlined } from '@ant-design/icons';

interface InviteCodeCardProps {
  code: string;
  link: string;
  onRegenerate?: () => void;
}

export const InviteCodeCard: React.FC<InviteCodeCardProps> = ({
  code,
  link,
  onRegenerate
}) => {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${type} copied to clipboard!`);
  };

  return (
    <Card title="Your Invite Code">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary">Invite Code</Typography.Text>
          <Typography.Title level={2} copyable={{ text: code }}>
            {code}
          </Typography.Title>
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(code, 'Code')}
            block
          >
            Copy Code
          </Button>
        </div>
        <div>
          <Typography.Text type="secondary">Invite Link</Typography.Text>
          <Typography.Paragraph copyable={{ text: link }}>
            <LinkOutlined /> {link}
          </Typography.Paragraph>
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(link, 'Link')}
            block
          >
            Copy Link
          </Button>
        </div>
        {onRegenerate && (
          <Button
            icon={<ReloadOutlined />}
            onClick={onRegenerate}
            block
            danger
          >
            Regenerate Code
          </Button>
        )}
      </Space>
    </Card>
  );
};
```

**Deliverable:**
- ✅ InviteCodeCard component
- ✅ Copy functionality
- ✅ Regenerate option
- ✅ TypeScript types

---

### Task 1.8: Create SocialShareButtons Component

**File:** `packages/frontend/src/components/invite/SocialShareButtons.tsx`

#### Features
- Share on Facebook
- Share on Twitter
- Share on Line
- Share via Email
- Share via WhatsApp
- Custom share message

#### Implementation Requirements

```typescript
import React from 'react';
import { Card, Button, Space } from 'antd';
import {
  FacebookOutlined,
  TwitterOutlined,
  MailOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';

interface SocialShareButtonsProps {
  link: string;
  message?: string;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  link,
  message = 'Join Smart AI Hub using my invite link!'
}) => {
  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareOnLine = () => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = 'Join Smart AI Hub';
    const body = `${message}\n\n${link}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message + ' ' + link)}`;
    window.open(url, '_blank');
  };

  return (
    <Card title="Share Your Invite Link">
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
        <Button
          icon={<MailOutlined />}
          onClick={shareViaEmail}
        >
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
    </Card>
  );
};
```

**Deliverable:**
- ✅ SocialShareButtons component
- ✅ 5 social platforms
- ✅ Popup windows
- ✅ TypeScript types

---

## Part 2: Agency Settings Page (Day 3-4)

### Task 2.1: Create Agency Settings Page

**File:** `packages/frontend/src/pages/agency/AgencySettings.tsx`

#### Features
1. Configure Referral Rewards for each tier
   - Organization Signup Reward
   - Admin Signup Reward
   - General Signup Reward
2. Display current settings
3. Display statistics (Total Rewards Given)
4. Validation (must have sufficient Points/Credits)
5. Save settings

#### Implementation Requirements

```typescript
import React, { useState, useEffect } from 'react';
import { Card, message, Spin } from 'antd';
import { RouteGuard } from '../../components/guards/RouteGuard';
import { AgencyRewardSettings } from '../../components/agency/AgencyRewardSettings';
import { RewardStatistics } from '../../components/agency/RewardStatistics';

export const AgencySettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
    fetchStatistics();
  }, []);

  const fetchSettings = async () => {
    // GET /api/v1/agency/referral-config
  };

  const fetchStatistics = async () => {
    // GET /api/v1/agency/reward-stats
  };

  const handleSaveSettings = async (newSettings: any) => {
    // POST /api/v1/agency/referral-config
  };

  return (
    <RouteGuard allowedTiers={['agency']}>
      <div className="agency-settings-page">
        <Typography.Title level={2}>Agency Settings</Typography.Title>
        {loading ? (
          <Spin />
        ) : (
          <>
            <RewardStatistics statistics={statistics} />
            <AgencyRewardSettings
              settings={settings}
              onSave={handleSaveSettings}
            />
          </>
        )}
      </div>
    </RouteGuard>
  );
};
```

**Access Control:**
- ✅ RouteGuard with `allowedTiers={['agency']}`
- ✅ Redirect to /dashboard if not Agency
- ✅ Show 403 error if unauthorized

**API Integration:**
- `GET /api/v1/agency/referral-config` - Get current settings
- `POST /api/v1/agency/referral-config` - Save settings
- `GET /api/v1/agency/reward-stats` - Get statistics

**Deliverable:**
- ✅ Agency Settings page
- ✅ Access control enforced
- ✅ Responsive design
- ✅ Loading and error states

---

### Task 2.2: Create AgencyRewardSettings Component

**File:** `packages/frontend/src/components/agency/AgencyRewardSettings.tsx`

#### Features
- Form to configure rewards for each tier
- Input fields for Organization, Admin, General signup rewards
- Validation (must be positive numbers)
- Balance check (must have sufficient Points)
- Save button
- Reset button

#### Implementation Requirements

```typescript
import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Space, message, Alert } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

interface RewardSettings {
  organizationSignupReward: number;
  adminSignupReward: number;
  generalSignupReward: number;
}

interface AgencyRewardSettingsProps {
  settings: RewardSettings;
  onSave: (settings: RewardSettings) => Promise<void>;
  currentBalance?: number;
}

export const AgencyRewardSettings: React.FC<AgencyRewardSettingsProps> = ({
  settings,
  onSave,
  currentBalance
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: RewardSettings) => {
    setLoading(true);
    try {
      await onSave(values);
      message.success('Settings saved successfully!');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue(settings);
  };

  return (
    <Card title="Referral Reward Configuration">
      <Alert
        message="Note: Rewards will be deducted from your Agency balance when users sign up via your invite."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {currentBalance !== undefined && (
        <Alert
          message={`Current Balance: ${currentBalance} Points`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Organization Signup Reward (Points)"
          name="organizationSignupReward"
          rules={[
            { required: true, message: 'Please enter reward amount' },
            { type: 'number', min: 0, message: 'Must be positive' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 5000"
          />
        </Form.Item>

        <Form.Item
          label="Admin Signup Reward (Points)"
          name="adminSignupReward"
          rules={[
            { required: true, message: 'Please enter reward amount' },
            { type: 'number', min: 0, message: 'Must be positive' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 2000"
          />
        </Form.Item>

        <Form.Item
          label="General Signup Reward (Points)"
          name="generalSignupReward"
          rules={[
            { required: true, message: 'Please enter reward amount' },
            { type: 'number', min: 0, message: 'Must be positive' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 1000"
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Save Settings
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
```

**Validation:**
- All fields required
- Must be positive numbers
- Optional: Check if total potential rewards exceed balance

**Deliverable:**
- ✅ AgencyRewardSettings component
- ✅ Form validation
- ✅ Save/Reset functionality
- ✅ TypeScript types

---

### Task 2.3: Create RewardStatistics Component

**File:** `packages/frontend/src/components/agency/RewardStatistics.tsx`

#### Features
- Display total rewards given
- Display rewards by tier (Organization, Admin, General)
- Display number of signups per tier
- Display chart showing rewards over time

#### Implementation Requirements

```typescript
import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { TrophyOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
}

export const RewardStatistics: React.FC<RewardStatisticsProps> = ({
  statistics
}) => {
  return (
    <Card title="Reward Statistics">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Statistic
            title="Total Rewards Given"
            value={statistics.totalRewardsGiven}
            prefix={<TrophyOutlined />}
            suffix="Points"
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Organization Signups"
            value={statistics.organizationSignups}
            prefix={<TeamOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic
            title="Total Signups"
            value={
              statistics.organizationSignups +
              statistics.adminSignups +
              statistics.generalSignups
            }
            prefix={<UserOutlined />}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statistics.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tier" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="signups" fill="#8884d8" name="Signups" />
            <Bar yAxisId="right" dataKey="rewards" fill="#82ca9d" name="Rewards (Points)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
```

**Deliverable:**
- ✅ RewardStatistics component
- ✅ Statistics cards
- ✅ Bar chart
- ✅ TypeScript types

---

## Part 3: Additional Components (Day 5-6)

### Task 3.1: Create HierarchyTree Component

**File:** `packages/frontend/src/components/hierarchy/HierarchyTree.tsx`

#### Features
- Display hierarchy as expandable tree
- Filtered by visibility rules
- Show Tier Badge for each user
- Show Points & Credits balance
- Show Status (Active/Blocked)
- Expandable/Collapsible nodes
- Click to view user details

#### Implementation Requirements

```typescript
import React, { useState, useEffect } from 'react';
import { Tree, Card, Tag, Space, Typography, Spin } from 'antd';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { TierBadge } from './TierBadge';

interface HierarchyNode {
  id: string;
  name: string;
  email: string;
  tier: string;
  points: number;
  credits: number;
  isBlocked: boolean;
  children?: HierarchyNode[];
}

interface HierarchyTreeProps {
  data: HierarchyNode[];
  loading?: boolean;
  onNodeClick?: (node: HierarchyNode) => void;
}

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  data,
  loading = false,
  onNodeClick
}) => {
  const buildTreeData = (nodes: HierarchyNode[]) => {
    return nodes.map(node => ({
      title: (
        <Space>
          <TierBadge tier={node.tier} />
          <Typography.Text strong>{node.name}</Typography.Text>
          <Typography.Text type="secondary">({node.email})</Typography.Text>
          <Tag color="blue">{node.points} Points</Tag>
          <Tag color="green">{node.credits} Credits</Tag>
          {node.isBlocked && <Tag color="red">Blocked</Tag>}
        </Space>
      ),
      key: node.id,
      icon: <UserOutlined />,
      children: node.children ? buildTreeData(node.children) : undefined,
      data: node
    }));
  };

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (onNodeClick && info.node.data) {
      onNodeClick(info.node.data);
    }
  };

  if (loading) {
    return <Spin />;
  }

  return (
    <Card title="Hierarchy Tree">
      <Tree
        showLine
        showIcon
        switcherIcon={<DownOutlined />}
        defaultExpandAll
        treeData={buildTreeData(data)}
        onSelect={handleSelect}
      />
    </Card>
  );
};
```

**Use Cases:**
- Agency sees: Organizations + Admins + Generals under them
- Organization sees: Admins + Generals in their org
- Admin sees: Generals in their org

**API Integration:**
- `GET /api/v1/hierarchy/tree` - Get hierarchy tree (filtered by visibility)

**Deliverable:**
- ✅ HierarchyTree component
- ✅ Expandable tree structure
- ✅ Visibility filtering
- ✅ Click handlers
- ✅ TypeScript types

---

### Task 3.2: Create TierBadge Component

**File:** `packages/frontend/src/components/hierarchy/TierBadge.tsx`

#### Features
- Display tier icon
- Display tier name
- Color-coded by tier
- Tooltip with tier description
- Small/Medium/Large sizes

#### Implementation Requirements

```typescript
import React from 'react';
import { Tag, Tooltip } from 'antd';
import {
  CrownOutlined,
  ShopOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons';

type TierType = 'administrator' | 'agency' | 'organization' | 'admin' | 'general';

interface TierBadgeProps {
  tier: TierType;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showTooltip?: boolean;
}

const tierConfig = {
  administrator: {
    color: '#f5222d',
    icon: <CrownOutlined />,
    label: 'Administrator',
    description: 'System administrator with full access'
  },
  agency: {
    color: '#722ed1',
    icon: <ShopOutlined />,
    label: 'Agency',
    description: 'Manages multiple organizations'
  },
  organization: {
    color: '#1890ff',
    icon: <BankOutlined />,
    label: 'Organization',
    description: 'Manages admins and general users'
  },
  admin: {
    color: '#52c41a',
    icon: <TeamOutlined />,
    label: 'Admin',
    description: 'Manages general users in organization'
  },
  general: {
    color: '#8c8c8c',
    icon: <UserOutlined />,
    label: 'General',
    description: 'Regular user'
  }
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'medium',
  showIcon = true,
  showTooltip = true
}) => {
  const config = tierConfig[tier];
  
  const badge = (
    <Tag
      color={config.color}
      icon={showIcon ? config.icon : undefined}
      style={{
        fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
        padding: size === 'small' ? '2px 8px' : size === 'large' ? '6px 12px' : '4px 10px'
      }}
    >
      {config.label}
    </Tag>
  );

  if (showTooltip) {
    return (
      <Tooltip title={config.description}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
};
```

**Color Scheme:**
- Administrator: Red (#f5222d)
- Agency: Purple (#722ed1)
- Organization: Blue (#1890ff)
- Admin: Green (#52c41a)
- General: Gray (#8c8c8c)

**Deliverable:**
- ✅ TierBadge component
- ✅ 5 tier variants
- ✅ Color-coded
- ✅ Icons and tooltips
- ✅ TypeScript types

---

## Part 4: Custom Hooks (Supporting)

### Task 4.1: Create useReferral Hook

**File:** `packages/frontend/src/hooks/useReferral.tsx`

```typescript
import { useState, useEffect } from 'react';

interface ReferralData {
  inviteCode: string;
  inviteLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
}

export const useReferral = () => {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/referral/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  return { data, loading, error, refetch: fetchReferralData };
};
```

---

### Task 4.2: Create useHierarchy Hook

**File:** `packages/frontend/src/hooks/useHierarchy.tsx`

```typescript
import { useState, useEffect } from 'react';

interface HierarchyData {
  members: any[];
  tree: any[];
}

export const useHierarchy = () => {
  const [data, setData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHierarchyData = async () => {
    try {
      setLoading(true);
      const [membersRes, treeRes] = await Promise.all([
        fetch('/api/v1/hierarchy/members', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/v1/hierarchy/tree', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      const members = await membersRes.json();
      const tree = await treeRes.json();
      setData({ members: members.data, tree: tree.data });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  return { data, loading, error, refetch: fetchHierarchyData };
};
```

---

## Quality Standards

### Code Quality
- ✅ TypeScript with proper types
- ✅ React Hooks best practices
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design
- ✅ Accessibility (a11y)

### UI/UX
- ✅ Consistent with existing design
- ✅ Ant Design components
- ✅ Mobile-friendly
- ✅ Fast loading
- ✅ Clear error messages
- ✅ Intuitive navigation

### Security
- ✅ RouteGuard for protected pages
- ✅ Authorization checks
- ✅ Input validation
- ✅ Secure API calls (with tokens)

---

## Success Criteria (Week 2)

The Week 2 task is considered complete when:

- ✅ 3 new pages created (`/referrals`, `/invite`, `/agency/settings`)
- ✅ 8 new components created
- ✅ All components use TypeScript
- ✅ All components are responsive
- ✅ Access control working (RouteGuard)
- ✅ API integration complete
- ✅ Error handling implemented
- ✅ Loading states implemented
- ✅ UI is polished and user-friendly
- ✅ Code follows best practices

---

## Deliverables Summary

### Pages (3)
1. ✅ `Referrals.tsx` - Referrals page with statistics and charts
2. ✅ `Invite.tsx` - Invite page with QR code and social sharing
3. ✅ `AgencySettings.tsx` - Agency settings page (Agency only)

### Components (8)
1. ✅ `ReferralStatistics.tsx` - Statistics cards and chart
2. ✅ `ReferralList.tsx` - Table of referred users
3. ✅ `ReferralRewardsHistory.tsx` - Timeline of rewards
4. ✅ `QRCodeGenerator.tsx` - QR code generator
5. ✅ `InviteCodeCard.tsx` - Invite code display and copy
6. ✅ `SocialShareButtons.tsx` - Social media sharing
7. ✅ `AgencyRewardSettings.tsx` - Reward configuration form
8. ✅ `RewardStatistics.tsx` - Agency reward statistics

### Additional Components (2)
9. ✅ `HierarchyTree.tsx` - Hierarchy tree view
10. ✅ `TierBadge.tsx` - Tier badge component

### Hooks (2)
1. ✅ `useReferral.tsx` - Referral data hook
2. ✅ `useHierarchy.tsx` - Hierarchy data hook

---

## Instructions for Kilo Code

1. **Read existing code** to understand the project structure and patterns
2. **Install dependencies** if needed (qrcode.react, recharts)
3. **Create all components** following the specifications
4. **Create all pages** with proper routing
5. **Implement API integration** with error handling
6. **Test all components** for functionality and responsiveness
7. **Ensure TypeScript** types are correct
8. **Follow Ant Design** patterns and components
9. **Implement RouteGuard** for protected pages
10. **Add to routing** configuration

---

## Notes

- This is a frontend development task
- Do NOT modify backend code
- Do NOT modify existing components unless specified
- Use existing hooks and utilities where available
- Follow the existing code style and patterns
- Ensure all components are reusable
- Focus on user experience and polish

---

## Expected Timeline

- **Day 1-2:** Referrals & Invite Pages (8-10 hours)
- **Day 3-4:** Agency Settings Page (6-8 hours)
- **Day 5-6:** Additional Components (6-8 hours)
- **Total:** ~20-26 hours of work

---

## Output

Please create all pages, components, and hooks as specified. Confirm when complete and ready for testing.

