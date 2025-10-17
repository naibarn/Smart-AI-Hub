import React, { useState, useEffect } from 'react';
import { Row, Col, Space, Typography, Card, Spin, Alert, Select, Button } from 'antd';
import { ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import AgentGrid from '../components/marketplace/AgentGrid';
import SearchBar from '../components/marketplace/SearchBar';
import CategoryTabs from '../components/marketplace/CategoryTabs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Agent {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon?: string;
  type: 'AGENTFLOW' | 'CUSTOMGPT' | 'GEMINI_GEM';
  usageCount: number;
  creator: {
    displayName: string;
  };
  createdAt: string;
  metadata?: any;
}

interface MarketplaceStats {
  totalAgents: number;
  recentAgents: number;
  agentsByType: Array<{
    type: string;
    count: number;
  }>;
  agentsByCategory: Array<{
    category: string;
    count: number;
  }>;
}

const Marketplace: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState<string>('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);

  // Fetch agents from API
  const fetchAgents = async (page = 1, reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (activeCategory && activeCategory !== 'all') {
        if (['AGENTFLOW', 'CUSTOMGPT', 'GEMINI_GEM'].includes(activeCategory)) {
          params.append('type', activeCategory);
        } else {
          params.append('category', activeCategory);
        }
      }

      const response = await fetch(`/api/public/agents?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      
      if (reset) {
        setAgents(data.data);
      } else {
        setAgents(prev => page === 1 ? data.data : [...prev, ...data.data]);
      }
      
      setPagination(prev => ({
        ...prev,
        current: data.pagination.page,
        total: data.pagination.total,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch marketplace stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/public/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/public/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAgents(1, true);
    fetchStats();
    fetchCategories();
  }, [searchQuery, activeCategory, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle type change
  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setActiveCategory(type);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle pagination change
  const handlePaginationChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
    fetchAgents(page, false);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAgents(1, true);
    fetchStats();
    fetchCategories();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          Agent Marketplace
        </Title>
        <Text type="secondary">
          Discover and explore AI agents created by our community
        </Text>
        
        {stats && (
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {stats.totalAgents}
                  </div>
                  <div style={{ color: '#666' }}>Total Agents</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {stats.recentAgents}
                  </div>
                  <div style={{ color: '#666' }}>New This Week</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                    {stats.agentsByType.reduce((sum, type) => sum + type.count, 0)}
                  </div>
                  <div style={{ color: '#666' }}>Agent Flows</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                    {stats.agentsByCategory.length}
                  </div>
                  <div style={{ color: '#666' }}>Categories</div>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search agents by name, description, or category..."
              allowClear
            />
          </Col>
          <Col xs={24} md={12}>
            <Space wrap>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 120 }}
                size="middle"
              >
                <Option value="newest">Newest</Option>
                <Option value="oldest">Oldest</Option>
                <Option value="name">Name</Option>
                <Option value="popular">Popular</Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                size="middle"
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories.map(cat => ({ ...cat, key: cat.name }))}
        activeCategory={activeCategory}
        onChange={handleCategoryChange}
        showCount
        type="all"
        style={{ marginBottom: '24px' }}
      />

      {/* Type Tabs */}
      <CategoryTabs
        activeCategory={activeType}
        onChange={handleTypeChange}
        showCount={false}
        type="type"
        style={{ marginBottom: '24px' }}
      />

      {/* Error Alert */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Agents Grid */}
      <AgentGrid
        agents={agents}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePaginationChange}
        emptyText="No agents found. Try adjusting your filters or search terms."
      />
    </div>
  );
};

export default Marketplace;