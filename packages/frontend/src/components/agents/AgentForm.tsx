import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  Upload,
  message,
  Tabs,
  Badge,
  Tooltip,
} from 'antd';
import {
  InfoCircleOutlined,
  UploadOutlined,
  LinkOutlined,
  BookOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export enum AgentType {
  AGENTFLOW = 'AGENTFLOW',
  CUSTOMGPT = 'CUSTOMGPT',
  GEMINI_GEM = 'GEMINI_GEM',
}

export enum AgentVisibility {
  PRIVATE = 'PRIVATE',
  ORGANIZATION = 'ORGANIZATION',
  AGENCY = 'AGENCY',
  PUBLIC = 'PUBLIC',
}

interface AgentFormProps {
  initialValues?: any;
  onSubmit: (values: any) => void;
  loading?: boolean;
  isEdit?: boolean;
}

const AgentForm: React.FC<AgentFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<AgentType>(AgentType.AGENTFLOW);
  const [iconUrl, setIconUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('basic');

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setSelectedType(initialValues.type || AgentType.AGENTFLOW);
      setIconUrl(initialValues.icon || '');
    }
  }, [initialValues, form]);

  const handleTypeChange = (type: AgentType) => {
    setSelectedType(type);
    // Clear relevant fields when type changes
    if (type === AgentType.CUSTOMGPT || type === AgentType.GEMINI_GEM) {
      form.setFieldsValue({
        flowDefinition: null,
        inputSchema: null,
        outputSchema: null,
      });
    } else {
      form.setFieldsValue({
        externalUrl: '',
      });
    }
  };

  const handleSubmit = (values: any) => {
    const formData = {
      ...values,
      icon: iconUrl,
    };

    // Validate based on type
    if (selectedType === AgentType.CUSTOMGPT || selectedType === AgentType.GEMINI_GEM) {
      if (!values.externalUrl) {
        message.error('External URL is required for this agent type');
        return;
      }

      // Basic URL validation
      const urlPattern =
        selectedType === AgentType.CUSTOMGPT
          ? /^https:\/\/chat\.openai\.com\/g\/g-[a-zA-Z0-9]+/
          : /^https:\/\/gemini\.google\.com\/gem\/[a-zA-Z0-9\-_]+/;

      if (!urlPattern.test(values.externalUrl)) {
        message.error(
          `Invalid ${selectedType === AgentType.CUSTOMGPT ? 'Custom GPT' : 'Gemini Gem'} URL format`
        );
        return;
      }
    }

    onSubmit(formData);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload', // TODO: Replace with actual upload endpoint
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        setIconUrl(info.file.response.url);
        message.success('Icon uploaded successfully');
      } else if (info.file.status === 'error') {
        message.error('Icon upload failed');
      }
    },
  };

  const renderBasicInfo = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            label="Agent Name"
            name="name"
            rules={[{ required: true, message: 'Please enter agent name' }]}
          >
            <Input placeholder="Enter agent name" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              <Option value="Code Generation">Code Generation</Option>
              <Option value="Data Analysis">Data Analysis</Option>
              <Option value="Content Creation">Content Creation</Option>
              <Option value="Business">Business</Option>
              <Option value="Education">Education</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Research">Research</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Please enter agent description' }]}
      >
        <TextArea rows={4} placeholder="Describe what your agent does and how it works" />
      </Form.Item>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            label={
              <Space>
                Agent Type
                <Tooltip title="Different agent types have different capabilities and requirements">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            name="type"
            rules={[{ required: true, message: 'Please select agent type' }]}
          >
            <Select
              placeholder="Select agent type"
              onChange={handleTypeChange}
              value={selectedType}
            >
              <Option value={AgentType.AGENTFLOW}>
                <Space>
                  <Badge color="blue" />
                  Agent Flow
                </Space>
              </Option>
              <Option value={AgentType.CUSTOMGPT}>
                <Space>
                  <Badge color="green" />
                  Custom GPT
                </Space>
              </Option>
              <Option value={AgentType.GEMINI_GEM}>
                <Space>
                  <Badge color="purple" />
                  Gemini Gem
                </Space>
              </Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="Visibility"
            name="visibility"
            initialValue={AgentVisibility.PRIVATE}
            rules={[{ required: true, message: 'Please select visibility' }]}
          >
            <Select placeholder="Select visibility">
              <Option value={AgentVisibility.PRIVATE}>Private</Option>
              <Option value={AgentVisibility.ORGANIZATION}>Organization</Option>
              <Option value={AgentVisibility.AGENCY}>Agency</Option>
              <Option value={AgentVisibility.PUBLIC}>Public</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Icon URL">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Enter icon URL or upload"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
              />
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </Space.Compact>
          </Form.Item>
        </Col>
      </Row>

      {iconUrl && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <img
            src={iconUrl}
            alt="Agent Icon"
            style={{ width: '64px', height: '64px', borderRadius: '8px' }}
          />
        </div>
      )}
    </Space>
  );

  const renderConfiguration = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {selectedType === AgentType.CUSTOMGPT || selectedType === AgentType.GEMINI_GEM ? (
        <Card
          title={
            <Space>
              <LinkOutlined />
              External URL Configuration
            </Space>
          }
          size="small"
        >
          <Alert
            message={`${selectedType === AgentType.CUSTOMGPT ? 'Custom GPT' : 'Gemini Gem'} URL Format`}
            description={
              selectedType === AgentType.CUSTOMGPT
                ? 'URL must be in format: https://chat.openai.com/g/g-XXXXX-agent-name'
                : 'URL must be in format: https://gemini.google.com/gem/XXXXX'
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            label="External URL"
            name="externalUrl"
            rules={[
              { required: true, message: 'Please enter the external URL' },
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
          >
            <Input
              placeholder={
                selectedType === AgentType.CUSTOMGPT
                  ? 'https://chat.openai.com/g/g-XXXXX-agent-name'
                  : 'https://gemini.google.com/gem/XXXXX'
              }
            />
          </Form.Item>

          <Paragraph type="secondary">
            <InfoCircleOutlined /> Users will be redirected to this URL when they run the agent.
            Usage will be logged but no credits will be deducted.
          </Paragraph>
        </Card>
      ) : (
        <Card
          title={
            <Space>
              <PlusOutlined />
              Agent Flow Configuration
            </Space>
          }
          size="small"
        >
          <Alert
            message="Agent Flow Configuration"
            description="Configure the flow definition, input/output schemas for your agent flow."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item
            label="Flow Definition (JSON)"
            name="flowDefinition"
            rules={[{ required: true, message: 'Please enter flow definition' }]}
          >
            <TextArea
              rows={8}
              placeholder='{"steps": [...], "connections": [...]}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item label="Input Schema (JSON)" name="inputSchema">
            <TextArea
              rows={6}
              placeholder='{"type": "object", "properties": {...}}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item label="Output Schema (JSON)" name="outputSchema">
            <TextArea
              rows={6}
              placeholder='{"type": "object", "properties": {...}}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Card>
      )}
    </Space>
  );

  return (
    <Card>
      <div style={{ marginBottom: '24px' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={3}>{isEdit ? 'Edit Agent' : 'Create New Agent'}</Title>
          <Button type="link" icon={<BookOutlined />} href="/docs/agent-guidelines" target="_blank">
            Agent Guidelines
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialValues}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Basic Information" key="basic">
            {renderBasicInfo()}
          </TabPane>
          <TabPane tab="Configuration" key="configuration">
            {renderConfiguration()}
          </TabPane>
        </Tabs>

        <Divider />

        <Row justify="end">
          <Space>
            <Button onClick={() => form.resetFields()}>Reset</Button>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              {isEdit ? 'Update Agent' : 'Create Agent'}
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default AgentForm;
