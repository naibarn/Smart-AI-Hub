import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Anchor,
  Button,
  Space,
  Breadcrumb,
  Layout,
  Spin,
  Alert,
  Divider,
} from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  MenuOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Link } = Anchor;

interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

// Simple markdown renderer for basic markdown syntax
const renderMarkdown = (markdown: string): string => {
  return markdown
    // Headers
    .replace(/^# (.*$)/gim, '<h1 id="$1">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 id="$1">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 id="$1">$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4 id="$1">$1</h4>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
    // Wrap in paragraphs
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Lists (basic)
    .replace(/^\* (.+)$/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gim, '<li>$1</li>');
};

const AgentGuidelines: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the actual file
      // For now, we'll use a placeholder or fetch from the public directory
      const response = await fetch('/content/docs/agent-guidelines.md');
      
      if (!response.ok) {
        throw new Error('Failed to load guidelines');
      }
      
      const markdown = await response.text();
      setContent(markdown);
      generateTableOfContents(markdown);
      setError(null);
    } catch (err) {
      console.error('Error loading guidelines:', err);
      setError('Failed to load agent guidelines. Please try again later.');
      
      // Fallback content for development
      const fallbackContent = `
# Agent Creation and Submission Guidelines

This guide provides comprehensive information on creating, configuring, and submitting agents to the Smart AI Hub marketplace.

## Table of Contents

1. [Overview](#overview)
2. [Agent Types](#agent-types)
3. [General Requirements](#general-requirements)
4. [Agent Flow Configuration](#agent-flow-configuration)
5. [External Agent Configuration](#external-agent-configuration)
6. [Input/Output Schema](#inputoutput-schema)
7. [Best Practices](#best-practices)
8. [Examples](#examples)
9. [Restrictions and Prohibited Content](#restrictions-and-prohibited-content)
10. [Submission Process](#submission-process)
11. [Review and Approval](#review-and-approval)

## Overview

Smart AI Hub supports three types of agents:

- **Agent Flow**: Custom workflows with multiple steps and conditional logic
- **Custom GPT**: External ChatGPT agents hosted on OpenAI's platform
- **Gemini Gem**: External Gemini agents hosted on Google's platform

Each agent type has specific requirements and configuration options.

## Agent Types

### Agent Flow

Agent Flow agents are custom workflows that you design and host on our platform. They support:

- Multi-step processing
- Conditional branching
- Loop operations
- Custom prompts and logic
- Integration with multiple AI models

### Custom GPT

Custom GPT agents are external agents hosted on OpenAI's platform. Requirements:

- URL format: \`https://chat.openai.com/g/g-XXXXX-agent-name\`
- No flow definition required
- Usage is logged but no credits are deducted
- Users are redirected to the ChatGPT interface

### Gemini Gem

Gemini Gem agents are external agents hosted on Google's platform. Requirements:

- URL format: \`https://gemini.google.com/gem/XXXXX\`
- No flow definition required
- Usage is logged but no credits are deducted
- Users are redirected to the Gemini interface

## General Requirements

All agents must include the following information:

### Required Fields

- **Name** (max 255 characters)
  - Clear, descriptive title
  - No special characters or excessive punctuation
  - Example: "Code Review Assistant" instead of "!!!CODE!!!REVIEW!!!"

- **Description** (required)
  - Detailed explanation of what the agent does
  - Target audience and use cases
  - Key features and capabilities
  - Minimum 50 characters, maximum 2000 characters

- **Category** (required)
  - Select from predefined categories
  - Choose the most relevant category for your agent

- **Type** (required)
  - Agent Flow, Custom GPT, or Gemini Gem

- **Visibility** (required)
  - Private: Only you can use
  - Organization: Users in your organization can use
  - Agency: Users in your agency can use
  - Public: All approved users can use

### Optional Fields

- **Icon** (optional)
  - URL to a 64x64px image
  - PNG, JPG, or WebP format
  - Should represent your agent's functionality

- **Tags** (optional)
  - Comma-separated keywords
  - Help users discover your agent
  - Maximum 10 tags

## Agent Flow Configuration

### Flow Definition Format

The flow definition is a JSON object that defines your agent's workflow:

\`\`\`json
{
  "steps": [
    {
      "id": "step1",
      "name": "Input Processing",
      "type": "prompt",
      "config": {
        "prompt": "Process the user input: {{input}}",
        "model": "gpt-4",
        "temperature": 0.7
      }
    },
    {
      "id": "step2",
      "name": "Output Generation",
      "type": "prompt",
      "config": {
        "prompt": "Generate output based on: {{step1.output}}",
        "model": "gpt-3.5-turbo",
        "temperature": 0.5
      }
    }
  ],
  "connections": [
    {
      "from": "step1",
      "to": "step2",
      "condition": null
    }
  ]
}
\`\`\`

### Step Types

1. **prompt**: Single AI model interaction
2. **condition**: Conditional branching logic
3. **loop**: Repetitive processing
4. **transform**: Data transformation
5. **integration**: External API calls

### Step Configuration

Each step must include:

- \`id\`: Unique identifier
- \`name\`: Human-readable name
- \`type\`: Step type
- \`config\`: Step-specific configuration

### Connections

Define the flow between steps:

\`\`\`json
{
  "from": "source_step_id",
  "to": "target_step_id",
  "condition": "{{step1.output.confidence > 0.8}}"
}
\`\`\`

## External Agent Configuration

### Custom GPT Setup

1. Create your Custom GPT in the OpenAI interface
2. Copy the share URL
3. Extract the GPT ID from the URL
4. Submit with the correct URL format

**Example URL:**
\`\`\`
https://chat.openai.com/g/g-ABC123XYZ-my-code-assistant
\`\`\`

### Gemini Gem Setup

1. Create your Gem in the Gemini interface
2. Copy the share URL
3. Extract the Gem ID from the URL
4. Submit with the correct URL format

**Example URL:**
\`\`\`
https://gemini.google.com/gem/code-helper-123
\`\`\`

## Input/Output Schema

### Input Schema

Define the expected input format using JSON Schema:

\`\`\`json
{
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "title": "Input Text",
      "description": "The text to process",
      "minLength": 1,
      "maxLength": 5000
    },
    "language": {
      "type": "string",
      "title": "Language",
      "enum": ["en", "es", "fr", "de"],
      "default": "en"
    }
  },
  "required": ["text"]
}
\`\`\`

### Output Schema

Define the expected output format:

\`\`\`json
{
  "type": "object",
  "properties": {
    "result": {
      "type": "string",
      "title": "Processed Result",
      "description": "The processed output"
    },
    "confidence": {
      "type": "number",
      "title": "Confidence Score",
      "minimum": 0,
      "maximum": 1
    }
  },
  "required": ["result"]
}
\`\`\`

## Best Practices

### Prompt Engineering

1. **Be Specific**: Clear, detailed prompts produce better results
2. **Provide Examples**: Include few-shot examples when helpful
3. **Set Constraints**: Define output format and length limits
4. **Test Iteratively**: Refine prompts based on testing

**Good Example:**
\`\`\`
You are a code review assistant. Analyze the following code and provide:
1. Security vulnerabilities
2. Performance issues
3. Code style suggestions
4. Best practices recommendations

Format your response as a JSON object with these keys:
- security_issues: array of strings
- performance_issues: array of strings
- style_suggestions: array of strings
- best_practices: array of strings

Code to review:
{{code}}
\`\`\`

### Performance Optimization

1. **Choose Appropriate Models**: Use smaller models for simple tasks
2. **Optimize Prompts**: Keep prompts concise but comprehensive
3. **Cache Results**: Store frequently used results
4. **Monitor Usage**: Track token usage and costs

### User Experience

1. **Clear Descriptions**: Explain what your agent does
2. **Input Validation**: Provide helpful error messages
3. **Progress Indicators**: Show processing status for long operations
4. **Example Inputs**: Provide example inputs and expected outputs

## Examples

### Example 1: Text Summarization Agent

\`\`\`json
{
  "name": "Text Summarizer",
  "description": "Summarizes long texts into concise bullet points",
  "category": "Content Creation",
  "type": "AGENTFLOW",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "title": "Text to Summarize",
        "minLength": 100
      },
      "summaryLength": {
        "type": "string",
        "title": "Summary Length",
        "enum": ["brief", "medium", "detailed"],
        "default": "medium"
      }
    },
    "required": ["text"]
  },
  "flowDefinition": {
    "steps": [
      {
        "id": "summarize",
        "name": "Generate Summary",
        "type": "prompt",
        "config": {
          "prompt": "Summarize the following text in {{summaryLength}} format:\\n\\n{{text}}",
          "model": "gpt-3.5-turbo",
          "temperature": 0.3
        }
      }
    ],
    "connections": []
  }
}
\`\`\`

### Example 2: Custom GPT Agent

\`\`\`json
{
  "name": "Code Review GPT",
  "description": "AI-powered code review assistant for multiple programming languages",
  "category": "Code Generation",
  "type": "CUSTOMGPT",
  "externalUrl": "https://chat.openai.com/g/g-ABC123XYZ-code-reviewer",
  "inputSchema": null,
  "flowDefinition": null
}
\`\`\`

## Restrictions and Prohibited Content

### Prohibited Content

1. **Illegal Activities**: Any content facilitating illegal acts
2. **Harmful Content**: Hate speech, violence, self-harm promotion
3. **Privacy Violations**: Personal data extraction without consent
4. **Malicious Code**: Viruses, malware, or harmful scripts
5. **Spam**: Mass messaging or promotional content
6. **Copyright Infringement**: Unauthorized use of copyrighted material

### Quality Standards

1. **Functional**: Agents must work as described
2. **Accurate**: Provide reliable and correct information
3. **Safe**: Not produce harmful or dangerous outputs
4. **Performant**: Reasonable response times
5. **Well-documented**: Clear instructions and examples

## Submission Process

1. **Create Agent**: Use the agent creation form
2. **Test Thoroughly**: Verify all functionality
3. **Documentation**: Provide clear descriptions and examples
4. **Submit for Review**: Submit for approval
5. **Review Process**: Wait for admin review
6. **Publication**: Approved agents appear in the marketplace

### Review Criteria

- **Functionality**: Does the agent work as described?
- **Quality**: Is the output accurate and useful?
- **Safety**: Does it follow safety guidelines?
- **Documentation**: Is it well-documented?
- **User Experience**: Is it easy to use?

## Review and Approval

### Approval Timeline

- **Initial Review**: 1-3 business days
- **Additional Review**: 3-5 business days if changes needed
- **Publication**: Within 24 hours of approval

### Possible Outcomes

1. **Approved**: Agent is published to the marketplace
2. **Changes Requested**: Specific feedback provided for improvements
3. **Rejected**: Violates guidelines or quality standards

### Appeals Process

If your agent is rejected:

1. Review the feedback carefully
2. Make necessary changes
3. Resubmit with improvements
4. Include a response to reviewer comments

## Support

For questions about agent creation or submission:

- **Documentation**: Review this guide thoroughly
- **Examples**: Study existing successful agents
- **Community**: Join our developer community
- **Support**: Contact support@smarthub.ai

---

*Last updated: October 2024*
      `;
      
      setContent(fallbackContent);
      generateTableOfContents(fallbackContent);
    } finally {
      setLoading(false);
    }
  };

  const generateTableOfContents = (markdown: string) => {
    const lines = markdown.split('\n');
    const tocItems: TocItem[] = [];
    const stack: TocItem[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].replace(/\{#[^}]+\}/, '').trim(); // Remove {#anchor} if present
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        const item: TocItem = { id, title, level };

        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          tocItems.push(item);
        } else {
          const parent = stack[stack.length - 1];
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(item);
        }

        stack.push(item);
      }
    });

    setToc(tocItems);
  };

  const renderTocItems = (items: TocItem[]) => {
    return items.map((item) => (
      <Link key={item.id} href={`#${item.id}`} title={item.title}>
        {item.children && item.children.length > 0 && renderTocItems(item.children)}
      </Link>
    ));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Loading agent guidelines...</Text>
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={loadGuidelines}>
                Retry
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
            <BookOutlined />
            <span>Documentation</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Agent Guidelines</Breadcrumb.Item>
        </Breadcrumb>

        {/* Header */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ margin: 0 }}>
                <BookOutlined /> Agent Guidelines
              </Title>
              <Text type="secondary">
                Comprehensive guide for creating and submitting agents
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<MenuOutlined />}
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                >
                  {sidebarVisible ? 'Hide' : 'Show'} TOC
                </Button>
                <Button
                  type="primary"
                  href="/agents/create"
                >
                  Create Agent
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <Row gutter={[24, 24]}>
          {/* Table of Contents */}
          {sidebarVisible && (
            <Col xs={24} lg={6}>
              <Card
                title="Table of Contents"
                style={{ position: 'sticky', top: '24px' }}
                size="small"
              >
                <Anchor affix={false} offsetTop={80}>
                  {renderTocItems(toc)}
                </Anchor>
              </Card>
            </Col>
          )}

          {/* Main Content */}
          <Col xs={24} lg={sidebarVisible ? 18 : 24}>
            <Card
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ padding: '24px' }}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Scroll to Top Button */}
        <Button
          type="primary"
          shape="circle"
          icon={<ArrowUpOutlined />}
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
          }}
        />
      </Content>
    </Layout>
  );
};

export default AgentGuidelines;