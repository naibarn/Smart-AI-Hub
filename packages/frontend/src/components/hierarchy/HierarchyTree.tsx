import React, { useState, useEffect } from 'react';
import { Tree, Card, Tag, Space, Typography, Spin, Empty, Button } from 'antd';
import { DownOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import { TierBadge } from './TierBadge';
import type { DataNode, EventDataNode } from 'antd/es/tree';

const { Text } = Typography;

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
  onNodeClick,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    // Auto-expand first level on load
    if (data.length > 0) {
      setExpandedKeys(data.map((node) => node.id));
    }
  }, [data]);

  const buildTreeData = (nodes: HierarchyNode[]): DataNode[] => {
    return nodes.map((node) => ({
      title: (
        <Space size="small">
          <TierBadge tier={node.tier as any} size="small" showTooltip={false} />
          <Text strong>{node.name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ({node.email})
          </Text>
          <Tag color="blue">{node.points.toLocaleString()} Pts</Tag>
          <Tag color="green">{node.credits.toLocaleString()} Cr</Tag>
          {node.isBlocked && <Tag color="red">Blocked</Tag>}
        </Space>
      ),
      key: node.id,
      icon: <UserOutlined style={{ color: getTierColor(node.tier) }} />,
      children:
        node.children && node.children.length > 0 ? buildTreeData(node.children) : undefined,
      data: node,
    }));
  };

  const getTierColor = (tier: string) => {
    const tierColors: Record<string, string> = {
      administrator: '#f5222d',
      agency: '#722ed1',
      organization: '#1890ff',
      admin: '#52c41a',
      general: '#8c8c8c',
    };
    return tierColors[tier] || '#8c8c8c';
  };

  const handleSelect = (
    selectedKeys: React.Key[],
    info: {
      event: 'select';
      selected: boolean;
      node: EventDataNode<DataNode>;
      selectedNodes: DataNode[];
    }
  ) => {
    setSelectedKeys(selectedKeys);
    if (onNodeClick && info.node) {
      // The data is stored in the node itself when we build the tree
      const nodeData = (info.node as any).data;
      if (nodeData) {
        onNodeClick(nodeData as HierarchyNode);
      }
    }
  };

  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  const expandAll = () => {
    const getAllKeys = (nodes: HierarchyNode[]): React.Key[] => {
      let keys: React.Key[] = [];
      nodes.forEach((node) => {
        keys.push(node.id);
        if (node.children) {
          keys = keys.concat(getAllKeys(node.children));
        }
      });
      return keys;
    };
    setExpandedKeys(getAllKeys(data));
  };

  const collapseAll = () => {
    setExpandedKeys([]);
  };

  if (loading) {
    return (
      <Card title="Hierarchy Tree">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading hierarchy data...</div>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card title="Hierarchy Tree">
        <Empty description="No hierarchy data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  const treeData = buildTreeData(data);

  return (
    <Card
      title={
        <Space>
          <EyeOutlined />
          <span>Hierarchy Tree</span>
        </Space>
      }
      extra={
        <Space>
          <Button size="small" onClick={expandAll}>
            Expand All
          </Button>
          <Button size="small" onClick={collapseAll}>
            Collapse All
          </Button>
        </Space>
      }
    >
      <div
        style={{
          maxHeight: '600px',
          overflowY: 'auto',
          padding: '8px',
          backgroundColor: '#fafafa',
          borderRadius: '4px',
        }}
      >
        <Tree
          showLine
          showIcon
          switcherIcon={<DownOutlined />}
          treeData={treeData}
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          onExpand={handleExpand}
          onSelect={handleSelect}
          style={{ backgroundColor: 'transparent' }}
        />
      </div>

      <div
        style={{
          marginTop: 16,
          padding: '12px',
          backgroundColor: '#f6f8fa',
          borderRadius: '6px',
          border: '1px solid #e1e4e8',
        }}
      >
        <Text style={{ fontSize: '12px', color: '#666' }}>
          Click on any member to view details. The hierarchy shows your organization structure based
          on your tier and visibility permissions.
        </Text>
      </div>
    </Card>
  );
};
