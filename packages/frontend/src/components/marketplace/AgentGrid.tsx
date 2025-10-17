import React from 'react';
import { Row, Col, Empty, Spin, Pagination } from 'antd';
import AgentCard from './AgentCard';

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

interface AgentGridProps {
  agents: Agent[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: (total: number, range: [number, number]) => string;
  };
  onPageChange?: (page: number, pageSize: number) => void;
  emptyText?: string;
  grid?: {
    gutter?: [number, number];
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
}

const AgentGrid: React.FC<AgentGridProps> = ({
  agents,
  loading = false,
  pagination,
  onPageChange,
  emptyText = 'No agents found',
  grid = {
    gutter: [24, 24],
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    xxl: 4,
  },
}) => {
  if (loading && agents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#666' }}>
          Loading agents...
        </div>
      </div>
    );
  }

  if (!loading && agents.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty
          description={emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={grid.gutter}>
        {agents.map((agent) => (
          <Col
            key={agent.id}
            xs={grid.xs}
            sm={grid.sm}
            md={grid.md}
            lg={grid.lg}
            xl={grid.xl}
            xxl={grid.xxl}
          >
            <div style={{ height: '100%', marginBottom: grid.gutter?.[1] || 24 }}>
              <AgentCard agent={agent} loading={loading} />
            </div>
          </Col>
        ))}
      </Row>

      {pagination && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger={pagination.showSizeChanger !== false}
            showQuickJumper={pagination.showQuickJumper !== false}
            showTotal={pagination.showTotal || ((total, range) =>
              `${range[0]}-${range[1]} of ${total} agents`
            )}
            onChange={onPageChange}
            onShowSizeChange={onPageChange}
            pageSizeOptions={['12', '24', '36', '48']}
          />
        </div>
      )}

      {loading && agents.length > 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin />
          <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
            Loading more agents...
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentGrid;