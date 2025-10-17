import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Checkbox,
  Radio,
  Slider,
  Switch,
  Button,
  Space,
  Card,
  Typography,
} from 'antd';
import { PlayCircleOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface JSONSchemaField {
  type: string;
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  format?: string;
  properties?: Record<string, JSONSchemaField>;
  required?: string[];
  items?: JSONSchemaField;
}

interface AgentInputFormProps {
  inputSchema?: JSONSchemaField;
  onSubmit?: (values: any) => void;
  loading?: boolean;
  estimatedCost?: number;
  showCost?: boolean;
  disabled?: boolean;
}

const AgentInputForm: React.FC<AgentInputFormProps> = ({
  inputSchema,
  onSubmit,
  loading = false,
  estimatedCost = 0,
  showCost = true,
  disabled = false,
}) => {
  const [form] = Form.useForm();
  const [currentCost, setCurrentCost] = useState(estimatedCost);

  if (!inputSchema) {
    return null;
  }

  const handleSubmit = (values: any) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  const renderField = (name: string, field: JSONSchemaField, required: boolean = false) => {
    const {
      type,
      title,
      description,
      default: defaultValue,
      enum: enumValues,
      minimum,
      maximum,
    } = field;

    const fieldLabel = title || name;
    const fieldDescription = description;

    switch (type) {
      case 'string':
        if (field.format === 'textarea') {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[{ required, message: `Please enter ${fieldLabel}` }]}
              tooltip={fieldDescription}
              initialValue={defaultValue}
            >
              <TextArea
                rows={4}
                placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                disabled={disabled}
              />
            </Form.Item>
          );
        } else if (field.format === 'email') {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[
                { required, message: `Please enter ${fieldLabel}` },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
              tooltip={fieldDescription}
              initialValue={defaultValue}
            >
              <Input placeholder={`Enter ${fieldLabel.toLowerCase()}`} disabled={disabled} />
            </Form.Item>
          );
        } else if (field.format === 'url') {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[
                { required, message: `Please enter ${fieldLabel}` },
                { type: 'url', message: 'Please enter a valid URL' },
              ]}
              tooltip={fieldDescription}
              initialValue={defaultValue}
            >
              <Input placeholder={`Enter ${fieldLabel.toLowerCase()}`} disabled={disabled} />
            </Form.Item>
          );
        } else if (enumValues && enumValues.length > 0) {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[{ required, message: `Please select ${fieldLabel}` }]}
              tooltip={fieldDescription}
              initialValue={defaultValue || enumValues[0]}
            >
              <Select placeholder={`Select ${fieldLabel.toLowerCase()}`} disabled={disabled}>
                {enumValues.map((value: any) => (
                  <Option key={value} value={value}>
                    {value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        } else {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[{ required, message: `Please enter ${fieldLabel}` }]}
              tooltip={fieldDescription}
              initialValue={defaultValue}
            >
              <Input placeholder={`Enter ${fieldLabel.toLowerCase()}`} disabled={disabled} />
            </Form.Item>
          );
        }

      case 'number':
      case 'integer':
        if (minimum !== undefined && maximum !== undefined) {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[{ required, message: `Please enter ${fieldLabel}` }]}
              tooltip={fieldDescription}
              initialValue={defaultValue || minimum}
            >
              <Slider
                min={minimum}
                max={maximum}
                marks={{
                  [minimum]: minimum.toString(),
                  [maximum]: maximum.toString(),
                }}
                disabled={disabled}
              />
            </Form.Item>
          );
        } else {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[
                { required, message: `Please enter ${fieldLabel}` },
                { type: 'number', message: 'Please enter a valid number' },
              ]}
              tooltip={fieldDescription}
              initialValue={defaultValue}
            >
              <Input
                type="number"
                placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                disabled={disabled}
              />
            </Form.Item>
          );
        }

      case 'boolean':
        return (
          <Form.Item
            key={name}
            name={name}
            label={fieldLabel}
            valuePropName="checked"
            tooltip={fieldDescription}
            initialValue={defaultValue !== undefined ? defaultValue : false}
          >
            <Switch disabled={disabled} />
          </Form.Item>
        );

      case 'array':
        if (field.items && enumValues && enumValues.length > 0) {
          return (
            <Form.Item
              key={name}
              name={name}
              label={fieldLabel}
              rules={[{ required, message: `Please select ${fieldLabel}` }]}
              tooltip={fieldDescription}
              initialValue={defaultValue}
            >
              <Select
                mode="multiple"
                placeholder={`Select ${fieldLabel.toLowerCase()}`}
                disabled={disabled}
              >
                {enumValues.map((value: any) => (
                  <Option key={value} value={value}>
                    {value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          );
        }
        break;

      case 'object':
        if (field.properties) {
          const objectFields = Object.entries(field.properties).map(([key, subField]) =>
            renderField(`${name}.${key}`, subField, field.required?.includes(key) || false)
          );

          return (
            <Card key={name} title={fieldLabel} size="small" style={{ marginBottom: '16px' }}>
              {fieldDescription && (
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                  {fieldDescription}
                </Text>
              )}
              {objectFields}
            </Card>
          );
        }
        break;

      default:
        return (
          <Form.Item
            key={name}
            name={name}
            label={fieldLabel}
            rules={[{ required, message: `Please enter ${fieldLabel}` }]}
            tooltip={fieldDescription}
            initialValue={defaultValue}
          >
            <Input placeholder={`Enter ${fieldLabel.toLowerCase()}`} disabled={disabled} />
          </Form.Item>
        );
    }

    return null;
  };

  const renderForm = () => {
    if (inputSchema.type === 'object' && inputSchema.properties) {
      return Object.entries(inputSchema.properties).map(([name, field]) =>
        renderField(name, field, inputSchema.required?.includes(name) || false)
      );
    }

    return renderField('input', inputSchema, true);
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Agent Input</span>
          {showCost && currentCost > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarOutlined style={{ color: '#52c41a' }} />
              <Text strong style={{ color: '#52c41a' }}>
                ~{currentCost} credits
              </Text>
            </div>
          )}
        </div>
      }
      style={{ marginBottom: '24px' }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={disabled}>
        {renderForm()}

        <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlayCircleOutlined />}
            loading={loading}
            disabled={disabled}
            size="large"
            style={{ width: '100%' }}
          >
            {loading ? 'Running Agent...' : 'Run Agent'}
          </Button>
        </Form.Item>

        {showCost && currentCost > 0 && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Estimated cost: ~{currentCost} credits
            </Text>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default AgentInputForm;
