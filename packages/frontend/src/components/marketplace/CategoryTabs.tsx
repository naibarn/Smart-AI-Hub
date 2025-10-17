import React from 'react';
import { Tabs, Badge, Space } from 'antd';
import {
  AppstoreOutlined,
  CodeOutlined,
  RobotOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

const { TabPane } = Tabs;

interface Category {
  name: string;
  count?: number;
  icon?: React.ReactNode;
  key: string;
}

interface CategoryTabsProps {
  categories?: Category[];
  activeCategory?: string;
  onChange?: (category: string) => void;
  loading?: boolean;
  showCount?: boolean;
  size?: 'small' | 'middle' | 'large';
  type?: 'all' | 'type' | 'category';
  style?: React.CSSProperties;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories = [],
  activeCategory = 'all',
  onChange,
  loading = false,
  showCount = true,
  size = 'middle',
  type = 'all',
  style,
}) => {
  // Default categories based on type
  const getDefaultCategories = (): Category[] => {
    if (type === 'type') {
      return [
        {
          key: 'all',
          name: 'All',
          icon: <AppstoreOutlined />,
        },
        {
          key: 'AGENTFLOW',
          name: 'Agent Flows',
          icon: <CodeOutlined />,
        },
        {
          key: 'CUSTOMGPT',
          name: 'Custom GPTs',
          icon: <RobotOutlined />,
        },
        {
          key: 'GEMINI_GEM',
          name: 'Gemini Gems',
          icon: <ExperimentOutlined />,
        },
      ];
    }

    // For 'all' or 'category' type
    return [
      {
        key: 'all',
        name: 'All',
        icon: <AppstoreOutlined />,
      },
      ...categories.map((cat) => ({
        key: cat.name,
        name: cat.name,
        count: cat.count,
      })),
    ];
  };

  const displayCategories = categories.length > 0 ? getDefaultCategories() : getDefaultCategories();

  const handleTabChange = (key: string) => {
    if (onChange) {
      onChange(key);
    }
  };

  const renderTabBadge = (count?: number) => {
    if (!showCount || !count || count === 0) {
      return null;
    }

    return (
      <Badge
        count={count}
        showZero={false}
        size="small"
        style={{
          backgroundColor: '#f0f0f0',
          color: '#666',
          boxShadow: 'none',
        }}
      />
    );
  };

  const renderTab = (category: Category) => {
    return (
      <TabPane
        key={category.key}
        tab={
          <Space size="small">
            {category.icon}
            <span>{category.name}</span>
            {renderTabBadge(category.count)}
          </Space>
        }
      />
    );
  };

  return (
    <div className="category-tabs" style={style}>
      <Tabs
        activeKey={activeCategory}
        onChange={handleTabChange}
        size={size}
        type="card"
        tabBarStyle={{
          marginBottom: '16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {displayCategories.map(renderTab)}
      </Tabs>
    </div>
  );
};

export default CategoryTabs;
