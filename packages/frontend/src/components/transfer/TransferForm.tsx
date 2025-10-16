import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Radio, Space } from 'antd';
import { api } from '../../services/api';

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
      const response = await fetch('/api/v1/hierarchy/members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setUsers(data.data || []);
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
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: values.toUserId,
          amount: values.amount,
          description: values.note
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        message.success('Transfer successful!');
        form.resetFields();
      } else {
        message.error(data.error || 'Transfer failed');
      }
    } catch (error: any) {
      message.error('Transfer failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item label="Transfer Type">
        <Radio.Group value={transferType} onChange={(e: any) => setTransferType(e.target.value)}>
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
          filterOption={(input: any, option: any) =>
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
        rules={[
          { required: true, message: 'Please enter amount' },
          { type: 'number', min: 1, message: 'Amount must be greater than 0' }
        ]}
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