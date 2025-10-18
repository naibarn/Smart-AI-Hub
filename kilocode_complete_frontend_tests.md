Complete Frontend UI and Security Tests for Smart AI Hub

## Context

The backend implementation for both **Points System** and **Multi-tier User Hierarchy & Referral System** is complete. However, the following are still missing:

1. Frontend UI components and pages
2. Comprehensive security tests
3. E2E tests

This prompt will guide you to complete these remaining tasks.

---

## Part 1: Security Tests

### Objective

Write comprehensive security tests to validate:

- User visibility rules for all tier combinations
- Transfer authorization with visibility checks
- Referral system security
- Block/Unblock authorization
- Audit logging

### Task 1.1: Visibility Rules Tests

**File:** `tests/security/visibility.test.ts`

```typescript
import { prisma } from '../../src/lib/prisma';
import { checkUserVisibility } from '../../src/middleware/visibilityCheckRaw';

describe('Visibility Rules', () => {
  let admin: any;
  let agency1: any, agency2: any;
  let org1: any, org2: any;
  let orgAdmin1: any, orgAdmin2: any;
  let general1: any, general2: any;

  beforeAll(async () => {
    // Create test hierarchy
    admin = await createUser({ tier: 'administrator' });

    agency1 = await createUser({ tier: 'agency' });
    agency2 = await createUser({ tier: 'agency' });

    org1 = await createUser({ tier: 'organization', parentAgencyId: agency1.id });
    org2 = await createUser({ tier: 'organization', parentAgencyId: agency2.id });

    orgAdmin1 = await createUser({ tier: 'admin', parentOrganizationId: org1.id });
    orgAdmin2 = await createUser({ tier: 'admin', parentOrganizationId: org2.id });

    general1 = await createUser({ tier: 'general', parentOrganizationId: org1.id });
    general2 = await createUser({ tier: 'general', parentOrganizationId: org2.id });
  });

  afterAll(async () => {
    // Clean up
    await cleanupTestUsers();
  });

  describe('Administrator Visibility', () => {
    it('should see all users', async () => {
      const canSeeAgency1 = await checkUserVisibility(admin.id, agency1.id);
      const canSeeOrg1 = await checkUserVisibility(admin.id, org1.id);
      const canSeeGeneral1 = await checkUserVisibility(admin.id, general1.id);

      expect(canSeeAgency1).toBe(true);
      expect(canSeeOrg1).toBe(true);
      expect(canSeeGeneral1).toBe(true);
    });
  });

  describe('Agency Visibility', () => {
    it('should see organizations under them', async () => {
      const canSeeOrg1 = await checkUserVisibility(agency1.id, org1.id);
      expect(canSeeOrg1).toBe(true);
    });

    it('should see admins in their organizations', async () => {
      const canSeeAdmin1 = await checkUserVisibility(agency1.id, orgAdmin1.id);
      expect(canSeeAdmin1).toBe(true);
    });

    it('should see generals under them', async () => {
      const canSeeGeneral1 = await checkUserVisibility(agency1.id, general1.id);
      expect(canSeeGeneral1).toBe(true);
    });

    it('should NOT see other agencies', async () => {
      const canSeeAgency2 = await checkUserVisibility(agency1.id, agency2.id);
      expect(canSeeAgency2).toBe(false);
    });

    it('should NOT see organizations of other agencies', async () => {
      const canSeeOrg2 = await checkUserVisibility(agency1.id, org2.id);
      expect(canSeeOrg2).toBe(false);
    });

    it('should NOT see admins of other agencies', async () => {
      const canSeeAdmin2 = await checkUserVisibility(agency1.id, orgAdmin2.id);
      expect(canSeeAdmin2).toBe(false);
    });
  });

  describe('Organization Visibility', () => {
    it('should see admins in their organization', async () => {
      const canSeeAdmin1 = await checkUserVisibility(org1.id, orgAdmin1.id);
      expect(canSeeAdmin1).toBe(true);
    });

    it('should see generals in their organization', async () => {
      const canSeeGeneral1 = await checkUserVisibility(org1.id, general1.id);
      expect(canSeeGeneral1).toBe(true);
    });

    it('should NOT see other organizations', async () => {
      const canSeeOrg2 = await checkUserVisibility(org1.id, org2.id);
      expect(canSeeOrg2).toBe(false);
    });

    it('should NOT see admins of other organizations', async () => {
      const canSeeAdmin2 = await checkUserVisibility(org1.id, orgAdmin2.id);
      expect(canSeeAdmin2).toBe(false);
    });

    it('should NOT see generals of other organizations', async () => {
      const canSeeGeneral2 = await checkUserVisibility(org1.id, general2.id);
      expect(canSeeGeneral2).toBe(false);
    });
  });

  describe('Admin Visibility', () => {
    it('should see generals in same organization', async () => {
      const canSeeGeneral1 = await checkUserVisibility(orgAdmin1.id, general1.id);
      expect(canSeeGeneral1).toBe(true);
    });

    it('should see other admins in same organization', async () => {
      const admin2 = await createUser({ tier: 'admin', parentOrganizationId: org1.id });
      const canSeeAdmin2 = await checkUserVisibility(orgAdmin1.id, admin2.id);
      expect(canSeeAdmin2).toBe(true);
    });

    it('should NOT see generals of other organizations', async () => {
      const canSeeGeneral2 = await checkUserVisibility(orgAdmin1.id, general2.id);
      expect(canSeeGeneral2).toBe(false);
    });

    it('should NOT see admins of other organizations', async () => {
      const canSeeAdmin2 = await checkUserVisibility(orgAdmin1.id, orgAdmin2.id);
      expect(canSeeAdmin2).toBe(false);
    });
  });

  describe('General Visibility', () => {
    it('should see only themselves', async () => {
      const canSeeThemselves = await checkUserVisibility(general1.id, general1.id);
      expect(canSeeThemselves).toBe(true);
    });

    it('should NOT see other generals', async () => {
      const canSeeGeneral2 = await checkUserVisibility(general1.id, general2.id);
      expect(canSeeGeneral2).toBe(false);
    });

    it('should NOT see admins', async () => {
      const canSeeAdmin = await checkUserVisibility(general1.id, orgAdmin1.id);
      expect(canSeeAdmin).toBe(false);
    });

    it('should NOT see organizations', async () => {
      const canSeeOrg = await checkUserVisibility(general1.id, org1.id);
      expect(canSeeOrg).toBe(false);
    });
  });
});
```

### Task 1.2: Transfer Authorization Tests

**File:** `tests/security/transfer.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Transfer Authorization', () => {
  let agency: any, org: any, admin: any, general1: any, general2: any;
  let agencyToken: string, orgToken: string, adminToken: string, generalToken: string;

  beforeAll(async () => {
    // Create test hierarchy
    agency = await createUser({ tier: 'agency', points: 10000, credits: 100 });
    org = await createUser({
      tier: 'organization',
      parentAgencyId: agency.id,
      points: 5000,
      credits: 50,
    });
    admin = await createUser({
      tier: 'admin',
      parentOrganizationId: org.id,
      points: 1000,
      credits: 10,
    });
    general1 = await createUser({
      tier: 'general',
      parentOrganizationId: org.id,
      points: 500,
      credits: 5,
    });
    general2 = await createUser({
      tier: 'general',
      parentOrganizationId: org.id,
      points: 500,
      credits: 5,
    });

    agencyToken = generateToken(agency);
    orgToken = generateToken(org);
    adminToken = generateToken(admin);
    generalToken = generateToken(general1);
  });

  describe('Valid Transfers', () => {
    it('Agency can transfer to Organization', async () => {
      const response = await request(app)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          toUserId: org.id,
          amount: 1000,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('Organization can transfer to Admin', async () => {
      const response = await request(app)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          toUserId: admin.id,
          amount: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('Admin can transfer to General', async () => {
      const response = await request(app)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          toUserId: general1.id,
          amount: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Invalid Transfers', () => {
    it('should reject transfer to user not visible', async () => {
      const otherOrg = await createUser({ tier: 'organization', parentAgencyId: 'other-agency' });

      const response = await request(app)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          toUserId: otherOrg.id,
          amount: 1000,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not authorized');
    });

    it('should reject transfer with insufficient balance', async () => {
      const response = await request(app)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${generalToken}`)
        .send({
          toUserId: general2.id,
          amount: 10000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient');
    });

    it('should reject General transferring to another General', async () => {
      const response = await request(app)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${generalToken}`)
        .send({
          toUserId: general2.id,
          amount: 100,
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Transaction Atomicity', () => {
    it('should rollback on error', async () => {
      const initialBalance = await getPointsBalance(agency.id);

      // Try to transfer to non-existent user
      const response = await request(app)
        .post('/api/v1/transfer/points')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          toUserId: 'non-existent-id',
          amount: 1000,
        });

      expect(response.status).toBe(400);

      const finalBalance = await getPointsBalance(agency.id);
      expect(finalBalance).toBe(initialBalance);
    });
  });
});
```

### Task 1.3: Referral System Tests

**File:** `tests/security/referral.test.ts`

```typescript
describe('Referral System Security', () => {
  describe('Self-Referral Prevention', () => {
    it('should prevent user from using their own invite code', async () => {
      const user = await createUser({ tier: 'general' });
      const inviteCode = await generateInviteCode(user.id);

      const response = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        password: 'password123',
        inviteCode: inviteCode,
      });

      // Should register but not count as referral
      expect(response.status).toBe(200);

      const stats = await getReferralStats(user.id);
      expect(stats.totalReferrals).toBe(0);
    });
  });

  describe('Agency Referral Rewards', () => {
    it('should deduct from Agency balance when giving referral rewards', async () => {
      const agency = await createUser({ tier: 'agency', points: 10000 });

      // Set custom referral reward
      await setAgencyReferralReward(agency.id, {
        organizationReward: 5000,
        adminReward: 2000,
        generalReward: 1000,
      });

      const initialBalance = await getPointsBalance(agency.id);

      // Generate invite code
      const inviteCode = await generateInviteCode(agency.id);

      // Register new user with invite code
      await request(app).post('/api/auth/register').send({
        email: 'neworg@example.com',
        password: 'password123',
        tier: 'organization',
        inviteCode: inviteCode,
      });

      const finalBalance = await getPointsBalance(agency.id);
      expect(finalBalance).toBe(initialBalance - 5000);
    });

    it('should not give reward if Agency has insufficient balance', async () => {
      const agency = await createUser({ tier: 'agency', points: 100 });

      await setAgencyReferralReward(agency.id, {
        generalReward: 1000,
      });

      const inviteCode = await generateInviteCode(agency.id);

      const response = await request(app).post('/api/auth/register').send({
        email: 'newgeneral@example.com',
        password: 'password123',
        inviteCode: inviteCode,
      });

      // Should still register but no reward
      expect(response.status).toBe(200);

      const newUser = await getUserByEmail('newgeneral@example.com');
      expect(newUser.points).toBe(0);
    });
  });
});
```

### Task 1.4: Block System Tests

**File:** `tests/security/block.test.ts`

```typescript
describe('Block System Security', () => {
  describe('Block Authorization', () => {
    it('should allow Agency to block Organization', async () => {
      const agency = await createUser({ tier: 'agency' });
      const org = await createUser({ tier: 'organization', parentAgencyId: agency.id });

      const token = generateToken(agency);

      const response = await request(app)
        .post('/api/v1/block')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: org.id, reason: 'Test' });

      expect(response.status).toBe(200);
    });

    it('should NOT allow General to block anyone', async () => {
      const general = await createUser({ tier: 'general' });
      const other = await createUser({ tier: 'general' });

      const token = generateToken(general);

      const response = await request(app)
        .post('/api/v1/block')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: other.id, reason: 'Test' });

      expect(response.status).toBe(403);
    });
  });

  describe('Blocked User Restrictions', () => {
    it('should prevent blocked user from logging in', async () => {
      const user = await createUser({ tier: 'general', isBlocked: true });

      const response = await request(app).post('/api/auth/login').send({
        email: user.email,
        password: 'password123',
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('blocked');
    });

    it('should prevent blocked user from using API', async () => {
      const user = await createUser({ tier: 'general', isBlocked: false });
      const token = generateToken(user);

      // Block user
      await prisma.user.update({
        where: { id: user.id },
        data: { isBlocked: true },
      });

      const response = await request(app)
        .get('/api/v1/points/balance')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});
```

### Task 1.5: Audit Logging Tests

**File:** `tests/security/audit.test.ts`

```typescript
describe('Audit Logging', () => {
  it('should log all transfer operations', async () => {
    const sender = await createUser({ tier: 'agency', points: 10000 });
    const receiver = await createUser({ tier: 'organization', parentAgencyId: sender.id });

    const token = generateToken(sender);

    await request(app)
      .post('/api/v1/transfer/points')
      .set('Authorization', `Bearer ${token}`)
      .send({
        toUserId: receiver.id,
        amount: 1000,
      });

    const logs = await prisma.transfer.findMany({
      where: { fromUserId: sender.id },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].toUserId).toBe(receiver.id);
    expect(logs[0].amount).toBe(1000);
  });

  it('should log all block operations', async () => {
    const blocker = await createUser({ tier: 'agency' });
    const blocked = await createUser({ tier: 'organization', parentAgencyId: blocker.id });

    const token = generateToken(blocker);

    await request(app).post('/api/v1/block').set('Authorization', `Bearer ${token}`).send({
      userId: blocked.id,
      reason: 'Test reason',
    });

    const logs = await prisma.blockLog.findMany({
      where: { blockedUserId: blocked.id },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].blockedBy).toBe(blocker.id);
    expect(logs[0].reason).toBe('Test reason');
  });

  it('should log unauthorized access attempts', async () => {
    const general = await createUser({ tier: 'general' });
    const token = generateToken(general);

    // Try to access member list (unauthorized)
    await request(app).get('/api/v1/hierarchy/members').set('Authorization', `Bearer ${token}`);

    // Check audit log
    const logs = await prisma.auditLog.findMany({
      where: {
        userId: general.id,
        action: 'unauthorized_access',
      },
    });

    expect(logs.length).toBeGreaterThan(0);
  });
});
```

---

## Part 2: Frontend UI Components

### Objective

Create all frontend UI components and pages with proper access control.

### Task 2.1: Points & Credits Dashboard Component

**File:** `packages/frontend/src/components/PointsCreditsDashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Card, Button, Tabs, Table, Modal, Form, Input, message } from 'antd';
import { DollarOutlined, SwapOutlined, GiftOutlined } from '@ant-design/icons';
import api from '../utils/api';

export const PointsCreditsDashboard: React.FC = () => {
  const [balance, setBalance] = useState({ points: 0, credits: 0 });
  const [exchangeRate, setExchangeRate] = useState({ creditToPointsRate: 1000, pointsToDollarRate: 10000 });
  const [loading, setLoading] = useState(false);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchExchangeRate();
  }, []);

  const fetchBalance = async () => {
    try {
      const [pointsRes, creditsRes] = await Promise.all([
        api.get('/api/v1/points/balance'),
        api.get('/api/v1/credits/balance')
      ]);

      setBalance({
        points: pointsRes.data.data.points,
        credits: creditsRes.data.data.credits
      });
    } catch (error) {
      message.error('Failed to fetch balance');
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const res = await api.get('/api/v1/points/exchange-rate');
      setExchangeRate(res.data.data);
    } catch (error) {
      console.error('Failed to fetch exchange rate');
    }
  };

  const handleExchange = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/api/v1/points/exchange', {
        credits: values.credits
      });

      message.success('Exchange successful!');
      setExchangeModalVisible(false);
      fetchBalance();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Exchange failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (values: any) => {
    setLoading(true);
    try {
      // Integrate with payment gateway here
      const paymentResult = await processPayment(values.amountUSD);

      await api.post('/api/v1/points/purchase', {
        amountUSD: values.amountUSD,
        paymentMethod: paymentResult.method,
        paymentId: paymentResult.id
      });

      message.success('Purchase successful!');
      setPurchaseModalVisible(false);
      fetchBalance();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDailyReward = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/points/daily-reward');
      message.success(`Claimed ${res.data.data.points} points!`);
      fetchBalance();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Already claimed today');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="points-credits-dashboard">
      <Card title="Balance">
        <div className="balance-display">
          <div className="balance-item">
            <h3>Points</h3>
            <p className="balance-value">{balance.points.toLocaleString()}</p>
          </div>
          <div className="balance-item">
            <h3>Credits</h3>
            <p className="balance-value">{balance.credits.toLocaleString()}</p>
          </div>
        </div>

        <div className="actions">
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => setExchangeModalVisible(true)}
          >
            Exchange Credits to Points
          </Button>

          <Button
            icon={<DollarOutlined />}
            onClick={() => setPurchaseModalVisible(true)}
          >
            Purchase Points
          </Button>

          <Button
            icon={<GiftOutlined />}
            onClick={handleClaimDailyReward}
            loading={loading}
          >
            Claim Daily Reward
          </Button>
        </div>
      </Card>

      <Card title="Exchange Rate" style={{ marginTop: 16 }}>
        <p>1 Credit = {exchangeRate.creditToPointsRate.toLocaleString()} Points</p>
        <p>{exchangeRate.pointsToDollarRate.toLocaleString()} Points = $1 USD</p>
      </Card>

      {/* Exchange Modal */}
      <Modal
        title="Exchange Credits to Points"
        visible={exchangeModalVisible}
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
        visible={purchaseModalVisible}
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
```

### Task 2.2: Transfer Component

**File:** `packages/frontend/src/components/TransferForm.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Radio } from 'antd';
import api from '../utils/api';

export const TransferForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [transferType, setTransferType] = useState<'points' | 'credits'>('points');

  useEffect(() => {
    fetchVisibleUsers();
  }, []);

  const fetchVisibleUsers = async () => {
    try {
      // This API should return only users that current user can see
      const res = await api.get('/api/v1/hierarchy/members');
      setUsers(res.data.data);
    } catch (error) {
      message.error('Failed to fetch users');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const endpoint = transferType === 'points'
        ? '/api/v1/transfer/points'
        : '/api/v1/transfer/credits';

      await api.post(endpoint, {
        toUserId: values.toUserId,
        amount: values.amount,
        note: values.note
      });

      message.success('Transfer successful!');
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item label="Transfer Type">
        <Radio.Group value={transferType} onChange={(e) => setTransferType(e.target.value)}>
          <Radio value="points">Points</Radio>
          <Radio value="credits">Credits</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="toUserId"
        label="Recipient"
        rules={[{ required: true, message: 'Please select recipient' }]}
      >
        <Select
          showSearch
          placeholder="Select user"
          filterOption={(input, option: any) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {users.map((user: any) => (
            <Select.Option key={user.id} value={user.id}>
              {user.email} ({user.tier})
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="amount"
        label="Amount"
        rules={[{ required: true, message: 'Please enter amount' }]}
      >
        <Input type="number" min={1} />
      </Form.Item>

      <Form.Item name="note" label="Note (optional)">
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Transfer
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### Task 2.3: Member List Component

**File:** `packages/frontend/src/components/MemberList.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message } from 'antd';
import { BlockOutlined, UnlockOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

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
      const res = await api.get('/api/v1/hierarchy/members', {
        params: {
          page: pagination.page,
          limit: pagination.limit
        }
      });

      setMembers(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    } catch (error) {
      message.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      await api.post('/api/v1/block', {
        userId,
        reason: 'Blocked from member list'
      });

      message.success('User blocked successfully');
      fetchMembers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to block user');
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.post('/api/v1/block/unblock', { userId });
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
          {canBlock(user.tier, record.tier) && (
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
        onChange: (page) => setPagination(prev => ({ ...prev, page }))
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
```

### Task 2.4: Referral Component

**File:** `packages/frontend/src/components/ReferralCard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Card, Button, message, QRCode, Statistic, Row, Col } from 'antd';
import { CopyOutlined, QrcodeOutlined } from '@ant-design/icons';
import api from '../utils/api';

export const ReferralCard: React.FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [stats, setStats] = useState({ totalReferrals: 0, totalRewards: 0 });
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchInviteCode();
    fetchStats();
  }, []);

  const fetchInviteCode = async () => {
    try {
      const res = await api.get('/api/v1/referral/invite-code');
      setInviteCode(res.data.data.inviteCode);
    } catch (error) {
      message.error('Failed to fetch invite code');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/v1/referral/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/register?invite=${inviteCode}`;
    navigator.clipboard.writeText(link);
    message.success('Invite link copied!');
  };

  const inviteLink = `${window.location.origin}/register?invite=${inviteCode}`;

  return (
    <Card title="Referral Program">
      <Row gutter={16}>
        <Col span={12}>
          <Statistic title="Total Referrals" value={stats.totalReferrals} />
        </Col>
        <Col span={12}>
          <Statistic title="Total Rewards" value={stats.totalRewards} suffix="points" />
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <p><strong>Your Invite Code:</strong> {inviteCode}</p>
        <p><strong>Invite Link:</strong> {inviteLink}</p>

        <Space>
          <Button icon={<CopyOutlined />} onClick={copyInviteLink}>
            Copy Link
          </Button>

          <Button icon={<QrcodeOutlined />} onClick={() => setShowQR(!showQR)}>
            {showQR ? 'Hide' : 'Show'} QR Code
          </Button>
        </Space>

        {showQR && (
          <div style={{ marginTop: 16 }}>
            <QRCode value={inviteLink} />
          </div>
        )}
      </div>
    </Card>
  );
};
```

### Task 2.5: Route Guards

**File:** `packages/frontend/src/components/RouteGuard.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedTiers?: string[];
  redirectTo?: string;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedTiers,
  redirectTo = '/dashboard'
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedTiers && !allowedTiers.includes(user.tier)) {
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
};
```

### Task 2.6: Pages with Access Control

**File:** `packages/frontend/src/pages/MembersPage.tsx`

```typescript
import React from 'react';
import { RouteGuard } from '../components/RouteGuard';
import { MemberList } from '../components/MemberList';

export const MembersPage: React.FC = () => {
  return (
    <RouteGuard allowedTiers={['administrator', 'agency', 'organization', 'admin']}>
      <div className="members-page">
        <h1>Members</h1>
        <MemberList />
      </div>
    </RouteGuard>
  );
};
```

**File:** `packages/frontend/src/pages/TransferPage.tsx`

```typescript
import React from 'react';
import { RouteGuard } from '../components/RouteGuard';
import { TransferForm } from '../components/TransferForm';

export const TransferPage: React.FC = () => {
  return (
    <RouteGuard>
      <div className="transfer-page">
        <h1>Transfer Points & Credits</h1>
        <TransferForm />
      </div>
    </RouteGuard>
  );
};
```

---

## Part 3: E2E Tests

### Task 3.1: E2E Tests with Playwright

**File:** `tests/e2e/hierarchy.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Hierarchy E2E', () => {
  test('General user cannot access members page', async ({ page }) => {
    // Login as General user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'general@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Try to navigate to members page
    await page.goto('/members');

    // Should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('Agency can see and block Organization', async ({ page }) => {
    // Login as Agency
    await page.goto('/login');
    await page.fill('input[name="email"]', 'agency@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to members page
    await page.goto('/members');

    // Should see members table
    await expect(page.locator('table')).toBeVisible();

    // Should see Block button for Organization users
    const blockButton = page.locator('button:has-text("Block")').first();
    await expect(blockButton).toBeVisible();

    // Click block button
    await blockButton.click();

    // Should see success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('Transfer flow works correctly', async ({ page }) => {
    // Login as Agency
    await page.goto('/login');
    await page.fill('input[name="email"]', 'agency@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to transfer page
    await page.goto('/transfer');

    // Fill transfer form
    await page.selectOption('select[name="toUserId"]', { label: /organization@example.com/ });
    await page.fill('input[name="amount"]', '1000');
    await page.fill('textarea[name="note"]', 'Test transfer');

    // Submit form
    await page.click('button[type="submit"]');

    // Should see success message
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });
});
```

---

## Success Criteria

### Security Tests

- [ ] All visibility rules tested for all tier combinations
- [ ] Transfer authorization tested with valid and invalid scenarios
- [ ] Referral system security tested (self-referral prevention, Agency balance deduction)
- [ ] Block system authorization tested
- [ ] Audit logging verified for all critical operations
- [ ] Test coverage >80% for security-critical code

### Frontend

- [ ] Points & Credits Dashboard component working
- [ ] Transfer form with visibility-filtered user list working
- [ ] Member list with proper access control working
- [ ] Referral card with invite code and QR code working
- [ ] Route guards preventing unauthorized access
- [ ] All pages have proper access control
- [ ] General users cannot access /members page
- [ ] UI elements hidden based on user tier

### E2E Tests

- [ ] E2E tests for all user flows passing
- [ ] Tests cover all user tiers
- [ ] Tests verify access control
- [ ] Tests verify data visibility

---

## Deployment Checklist

- [ ] All security tests passing
- [ ] All E2E tests passing
- [ ] Frontend deployed
- [ ] Access control verified in production
- [ ] Visibility rules working correctly
- [ ] Audit logging enabled
- [ ] Monitoring and alerts set up

---

Please implement all security tests, frontend components, and E2E tests following this specification. Ensure all tests pass before deployment.
