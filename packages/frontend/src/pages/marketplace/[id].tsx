import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Spin,
  Alert,
  Button,
  Typography,
  Divider,
  Space,
  message,
  Breadcrumb,
  Result,
  Layout,
} from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  ShareAltOutlined,
  HeartOutlined,
  LinkOutlined,
} from '@ant-design/icons';

import AgentHeader from '../../components/marketplace/AgentHeader';
import AgentDescription from '../../components/marketplace/AgentDescription';
import ImageGallery from '../../components/marketplace/ImageGallery';
import VideoEmbed from '../../components/marketplace/VideoEmbed';
import AgentInputForm from '../../components/marketplace/AgentInputForm';
import RunAgentButton from '../../components/marketplace/RunAgentButton';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedAgents, setRelatedAgents] = useState<any[]>([]);
  const [agentInput, setAgentInput] = useState<any>({});

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token');
  const isOwner = isLoggedIn && agent?.creatorId === localStorage.getItem('userId');

  useEffect(() => {
    if (id) {
      fetchAgent(id);
      fetchRelatedAgents(id);
    }
  }, [id]);

  const fetchAgent = async (agentId: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await agentAPI.getAgentById(agentId);
      
      // Mock data for development
      const mockAgent = {
        id: agentId,
        name: 'Advanced Code Generator',
        description: 'An intelligent agent that generates high-quality code based on natural language descriptions. Supports multiple programming languages and frameworks.',
        category: 'Code Generation',
        type: 'Agent Flow',
        tags: ['coding', 'development', 'automation'],
        icon: 'https://via.placeholder.com/64x64/1890ff/ffffff?text=CODE',
        creator: {
          id: 'user1',
          name: 'John Doe',
          avatar: 'https://via.placeholder.com/40x40/1890ff/ffffff?text=JD',
        },
        status: 'APPROVED',
        visibility: 'PUBLIC',
        estimatedCost: 5,
        createdAt: '2023-10-15T10:30:00Z',
        updatedAt: '2023-10-16T14:20:00Z',
        usageCount: 1250,
        rating: 4.8,
        reviews: 42,
        images: [
          'https://via.placeholder.com/800x450/f0f0f0/333333?text=Code+Generator+Screenshot+1',
          'https://via.placeholder.com/800x450/f0f0f0/333333?text=Code+Generator+Screenshot+2',
        ],
        videos: [
          {
            embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            title: 'Demo Video',
          },
        ],
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              title: 'Code Description',
              description: 'Describe what you want the code to do',
            },
            language: {
              type: 'string',
              title: 'Programming Language',
              enum: ['javascript', 'python', 'java', 'csharp', 'php'],
              default: 'javascript',
            },
            framework: {
              type: 'string',
              title: 'Framework (optional)',
              description: 'Specify a framework if applicable',
            },
            includeTests: {
              type: 'boolean',
              title: 'Include Unit Tests',
              default: false,
            },
            outputFormat: {
              type: 'string',
              title: 'Output Format',
              enum: ['code', 'markdown', 'html'],
              default: 'code',
            },
          },
          required: ['description', 'language'],
        },
      };
      
      setAgent(mockAgent);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
      message.error('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedAgents = async (agentId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await agentAPI.getRelatedAgents(agentId);
      
      // Mock data for development
      const mockRelatedAgents = [
        {
          id: 'agent2',
          name: 'UI Component Generator',
          description: 'Generate React components with TypeScript and Tailwind CSS',
          category: 'UI Generation',
          type: 'Agent Flow',
          icon: 'https://via.placeholder.com/64x64/52c41a/ffffff?text=UI',
          estimatedCost: 3,
          rating: 4.6,
        },
        {
          id: 'agent3',
          name: 'API Documentation Generator',
          description: 'Generate comprehensive API documentation from code',
          category: 'Documentation',
          type: 'Custom GPT',
          icon: 'https://via.placeholder.com/64x64/722ed1/ffffff?text=API',
          estimatedCost: 4,
          rating: 4.5,
        },
      ];
      
      setRelatedAgents(mockRelatedAgents);
    } catch (err) {
      console.error('Failed to fetch related agents:', err);
    }
  };

  const handleRunAgent = async (agentId: string, input: any) => {
    try {
      // TODO: Replace with actual API call
      // const response = await agentAPI.runAgent(agentId, input);
      
      message.success('Agent execution started successfully!');
      // Navigate to execution results page
      navigate(`/executions/${agentId}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to run agent');
    }
  };

  const handleRunExternalAgent = async () => {
    if (!agent?.externalUrl) {
      message.error('External URL not available');
      return;
    }

    try {
      // Log usage before redirecting
      // TODO: Replace with actual API call
      // await agentAPI.runExternalAgent(agent.id, {});
      
      message.success('Opening external agent...');
      // Open in new tab
      window.open(agent.externalUrl, '_blank');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to open external agent');
    }
  };

  const handleShare = () => {
    // Copy current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    message.success('Link copied to clipboard!');
  };

  const handleFavorite = () => {
    // TODO: Implement favorite functionality
    message.info('Favorite feature coming soon!');
  };

  const handleEdit = () => {
    navigate(`/agents/${id}/edit`);
  };

  const goBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Loading agent details...</Text>
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  if (error || !agent) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Result
            status="404"
            title="Agent Not Found"
            subTitle="Sorry, the agent you're looking for doesn't exist or has been removed."
            extra={
              <Button type="primary" onClick={() => navigate('/marketplace')}>
                Back to Marketplace
              </Button>
            }
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item>
            <HomeOutlined />
            <span>Home</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <AppstoreOutlined />
            <span>Marketplace</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{agent.name}</Breadcrumb.Item>
        </Breadcrumb>

        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={goBack}
          style={{ marginBottom: '16px' }}
        >
          Back
        </Button>

        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          {/* Agent Header */}
          <AgentHeader agent={agent} />

          {/* Action Buttons */}
          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col xs={24} sm={12} md={8}>
              <RunAgentButton
                agentId={agent.id}
                agentName={agent.name}
                estimatedCost={agent.estimatedCost}
                onRun={handleRunAgent}
                block
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Button
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                block
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '40px',
                  borderRadius: '6px',
                  fontWeight: '500',
                }}
              >
                Share
              </Button>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Button
                icon={<HeartOutlined />}
                onClick={handleFavorite}
                block
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '40px',
                  borderRadius: '6px',
                  fontWeight: '500',
                }}
              >
                Favorite
              </Button>
            </Col>
            {isOwner && (
              <Col xs={24} sm={12} md={8}>
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  block
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: '40px',
                    borderRadius: '6px',
                    fontWeight: '500',
                  }}
                >
                  Edit Agent
                </Button>
              </Col>
            )}
          </Row>

          <Divider />

          {/* Main Content */}
          <Row gutter={[24, 24]}>
            {/* Left Column - Description, Images, Videos */}
            <Col xs={24} lg={16}>
              {/* Agent Description */}
              <AgentDescription description={agent.description} />

              {/* Images Gallery */}
              {agent.images && agent.images.length > 0 && (
                <Card title="Screenshots" style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                  <ImageGallery images={agent.images} />
                </Card>
              )}

              {/* Videos */}
              {agent.videos && agent.videos.length > 0 && (
                <Card title="Demo Videos" style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                  {agent.videos.map((video: any, index: number) => (
                    <VideoEmbed
                      key={index}
                      videoUrl={video.embedUrl}
                      title={video.title}
                    />
                  ))}
                </Card>
              )}
            </Col>

            {/* Right Column - Input Form, Info */}
            <Col xs={24} lg={8}>
              {/* Agent Input Form or External URL Button */}
              {(agent.type === 'CUSTOMGPT' || agent.type === 'GEMINI_GEM') ? (
                <Card title="Run Agent" style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Paragraph type="secondary">
                      This is an external agent. Click the button below to open it in a new tab.
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      icon={<LinkOutlined />}
                      block
                      onClick={handleRunExternalAgent}
                    >
                      Open in {agent.type === 'CUSTOMGPT' ? 'ChatGPT' : 'Gemini'}
                    </Button>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Usage will be logged but no credits will be deducted.
                    </Text>
                  </Space>
                </Card>
              ) : (
                <Card title="Run Agent" style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                  <AgentInputForm
                    inputSchema={agent.inputSchema}
                    onSubmit={(values: any) => setAgentInput(values)}
                  />
                </Card>
              )}

              {/* Agent Info */}
              <Card title="Agent Information" style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Category:</Text>
                    <div>{agent.category}</div>
                  </div>
                  <div>
                    <Text strong>Type:</Text>
                    <div>{agent.type}</div>
                  </div>
                  <div>
                    <Text strong>Created by:</Text>
                    <div>{agent.creator.name}</div>
                  </div>
                  <div>
                    <Text strong>Usage Count:</Text>
                    <div>{agent.usageCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <Text strong>Rating:</Text>
                    <div>{agent.rating} ({agent.reviews} reviews)</div>
                  </div>
                  <div>
                    <Text strong>Estimated Cost:</Text>
                    <div>{agent.estimatedCost} credits per run</div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Related Agents */}
          {relatedAgents.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <Title level={3}>Related Agents</Title>
              <Row gutter={[16, 16]}>
                {relatedAgents.map((relatedAgent) => (
                  <Col xs={24} sm={12} md={8} key={relatedAgent.id}>
                    <Card
                      hoverable
                      cover={
                        <div
                          style={{
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f5f5f5',
                          }}
                        >
                          <img
                            src={relatedAgent.icon}
                            alt={relatedAgent.name}
                            style={{ width: '64px', height: '64px' }}
                          />
                        </div>
                      }
                      onClick={() => navigate(`/marketplace/${relatedAgent.id}`)}
                    >
                      <Card.Meta
                        title={relatedAgent.name}
                        description={
                          <div>
                            <div>{relatedAgent.description}</div>
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary">
                                {relatedAgent.estimatedCost} credits
                              </Text>
                              <span style={{ margin: '0 8px' }}>•</span>
                              <Text type="secondary">
                                {relatedAgent.rating} ★
                              </Text>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default AgentDetail;