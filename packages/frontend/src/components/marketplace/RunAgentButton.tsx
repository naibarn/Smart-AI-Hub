import React, { useState } from 'react';
import { Button, Modal, Typography, Space, Alert, Spin } from 'antd';
import { PlayCircleOutlined, LoginOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface RunAgentButtonProps {
  agentId: string;
  agentName: string;
  estimatedCost?: number;
  size?: 'small' | 'middle' | 'large';
  type?: 'primary' | 'default' | 'dashed';
  icon?: React.ReactNode;
  block?: boolean;
  disabled?: boolean;
  onRun?: (agentId: string, input: any) => Promise<void>;
}

const RunAgentButton: React.FC<RunAgentButtonProps> = ({
  agentId,
  agentName,
  estimatedCost = 0,
  size = 'middle',
  type = 'primary',
  icon = <PlayCircleOutlined />,
  block = false,
  disabled = false,
  onRun,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is logged in (this is a simplified check)
  const isLoggedIn = !!localStorage.getItem('token'); // Adjust based on your auth implementation

  const handleRunClick = () => {
    if (!isLoggedIn) {
      // Show login modal
      setModalVisible(true);
      return;
    }

    // Directly run the agent if logged in
    runAgent();
  };

  const runAgent = async (input?: any) => {
    setLoading(true);
    setError(null);

    try {
      if (onRun) {
        await onRun(agentId, input || {});
      } else {
        // Default behavior - navigate to run page or show modal
        console.log('Running agent:', agentId, 'with input:', input || {});
        // TODO: Implement default run behavior
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run agent');
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  const handleLogin = () => {
    // Navigate to login page
    navigate('/login');
  };

  const handleSignup = () => {
    // Navigate to signup page
    navigate('/register');
  };

  const renderLoginModal = () => (
    <Modal
      title="Login Required"
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setModalVisible(false)}>
          Cancel
        </Button>,
        <Button key="signup" onClick={handleSignup}>
          Sign Up
        </Button>,
        <Button key="login" type="primary" onClick={handleLogin}>
          Login
        </Button>,
      ]}
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <LoginOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />

        <Title level={4}>Login to Run Agent</Title>

        <Paragraph>
          You need to be logged in to run <strong>{agentName}</strong>.
        </Paragraph>

        {estimatedCost > 0 && (
          <Alert
            message={
              <Space>
                <DollarOutlined />
                <span>This agent requires ~{estimatedCost} credits to run</span>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginTop: '16px', textAlign: 'left' }}
          />
        )}

        <div style={{ marginTop: '24px' }}>
          <Text type="secondary">
            Don't have an account?{' '}
            <Button type="link" onClick={handleSignup} style={{ padding: 0 }}>
              Sign up
            </Button>{' '}
            for free and get started!
          </Text>
        </div>
      </div>
    </Modal>
  );

  const renderConfirmModal = () => (
    <Modal
      title="Run Agent"
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="run"
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          onClick={() => runAgent()}
        >
          Run Agent
        </Button>,
      ]}
      width={400}
    >
      <div style={{ padding: '20px 0' }}>
        <Title level={4}>Run {agentName}?</Title>

        <Paragraph>
          Are you sure you want to run this agent?{' '}
          {estimatedCost > 0 && `This will cost approximately ${estimatedCost} credits.`}
        </Paragraph>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Running agent...</div>
          </div>
        )}
      </div>
    </Modal>
  );

  return (
    <>
      <Button
        type={type}
        size={size}
        icon={icon}
        block={block}
        disabled={disabled || loading}
        onClick={handleRunClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {loading ? 'Running...' : 'Run Agent'}
      </Button>

      {renderLoginModal()}
      {renderConfirmModal()}
    </>
  );
};

export default RunAgentButton;
