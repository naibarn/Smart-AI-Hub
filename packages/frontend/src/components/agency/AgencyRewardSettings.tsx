import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Space, message, Alert, Input } from 'antd';
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
  loading?: boolean;
}

export const AgencyRewardSettings: React.FC<AgencyRewardSettingsProps> = ({
  settings,
  onSave,
  currentBalance,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: RewardSettings) => {
    setSubmitting(true);
    try {
      await onSave(values);
      message.success('Settings saved successfully!');
    } catch (error) {
      message.error('Failed to save settings');
      console.error('Save settings error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue(settings);
  };

  const validateRewards = (_: any, value: number) => {
    if (value < 0) {
      return Promise.reject(new Error('Reward must be a positive number'));
    }

    if (currentBalance !== undefined) {
      const formValues = form.getFieldsValue();
      const totalPotentialRewards =
        (formValues.organizationSignupReward || 0) +
        (formValues.adminSignupReward || 0) +
        (formValues.generalSignupReward || 0);

      if (totalPotentialRewards > currentBalance) {
        return Promise.reject(new Error('Total rewards exceed your current balance'));
      }
    }

    return Promise.resolve();
  };

  return (
    <Card title="Referral Reward Configuration" loading={loading}>
      <Alert
        message="Note: Rewards will be deducted from your Agency balance when users sign up via your invite."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {currentBalance !== undefined && (
        <Alert
          message={`Current Balance: ${currentBalance.toLocaleString()} Points`}
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
        size="large"
      >
        <Form.Item
          label="Organization Signup Reward (Points)"
          name="organizationSignupReward"
          rules={[
            { required: true, message: 'Please enter reward amount' },
            { validator: validateRewards },
          ]}
          tooltip="Reward given when someone signs up as an Organization using your invite code"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 5000"
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseInt(value!.replace(/\$\s?|(,*)/g, '') || '0', 10)}
            addonAfter="Points"
          />
        </Form.Item>

        <Form.Item
          label="Admin Signup Reward (Points)"
          name="adminSignupReward"
          rules={[
            { required: true, message: 'Please enter reward amount' },
            { validator: validateRewards },
          ]}
          tooltip="Reward given when someone signs up as an Admin using your invite code"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 2000"
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseInt(value!.replace(/\$\s?|(,*)/g, '') || '0', 10)}
            addonAfter="Points"
          />
        </Form.Item>

        <Form.Item
          label="General Signup Reward (Points)"
          name="generalSignupReward"
          rules={[
            { required: true, message: 'Please enter reward amount' },
            { validator: validateRewards },
          ]}
          tooltip="Reward given when someone signs up as a General user using your invite code"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="e.g., 1000"
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => parseInt(value!.replace(/\$\s?|(,*)/g, '') || '0', 10)}
            addonAfter="Points"
          />
        </Form.Item>

        <Form.Item>
          <Space size="large">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={submitting}
              size="large"
            >
              Save Settings
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset} size="large">
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};
