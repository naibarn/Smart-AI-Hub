---
title: "Dashboard Page"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P0 - Critical"
related_specs: ["FR-003-CreditManagement", "FR-004-ChatInterface", "FR-005-UsageMonitoring"]
---

# Dashboard Page

## 1. ภาพรวม (Overview)

The Dashboard is the main landing page for authenticated users, providing a comprehensive overview of their account status, credit balance, recent activities, and quick access to key features of the Smart AI Hub platform.

## 2. วัตถุประสงค์ (Objectives)

- แสดงข้อมูลสรุปของบัญชีผู้ใช้ในหน้าเดียว
- ให้การเข้าถึงฟีเจอร์หลักอย่างรวดเร็ว
- แสดงสถานะเครดิตและการใช้งานล่าสุด
- ให้ข้อมูลเชิงลึกเกี่ยวกับพฤติกรรมการใช้งาน
- ส่งเสริมการมีส่วนร่วมและการใช้งานแพลตฟอร์ม

## 3. Component Hierarchy

```
DashboardPage
├── DashboardHeader
│   ├── WelcomeMessage
│   ├── UserAvatar
│   └── NotificationsButton
├── CreditBalanceCard
│   ├── CurrentBalance
│   ├── LastUpdated
│   ├── QuickTopUpButton
│   └── ViewTransactionsLink
├── QuickActionsGrid
│   ├── NewChatButton
│   ├── BuyCreditsButton
│   ├── ViewHistoryButton
│   └── ProfileButton
├── UsageChart
│   ├── ChartContainer
│   ├── DateRangeSelector
│   └── ChartLegend
├── RecentActivity
│   ├── ActivityList
│   ├── ActivityItem
│   └── ViewAllLink
└── ServiceStatusBanner
    ├── StatusIndicator
    └── StatusMessage
```

## 4. Component Specifications

### 4.1 DashboardPage

**Purpose**: Main dashboard container with layout and data fetching

**Props**:
```typescript
interface DashboardPageProps {
  userId?: string;
  className?: string;
}
```

**State**:
```typescript
interface DashboardState {
  user: User | null;
  creditBalance: number;
  usageData: UsageData[];
  recentActivity: Activity[];
  serviceStatus: ServiceStatus;
  isLoading: boolean;
  error: string | null;
  dateRange: DateRange;
}
```

**Features**:
- Responsive grid layout
- Real-time data updates
- Error boundaries for graceful degradation
- Loading skeleton screens

### 4.2 DashboardHeader

**Purpose**: Top section with user information and navigation

**Props**:
```typescript
interface DashboardHeaderProps {
  user: User;
  onNotificationClick: () => void;
  notificationCount: number;
}
```

**UI Elements**:
- Personalized welcome message
- User avatar with dropdown menu
- Notifications button with badge
- Quick settings access

### 4.3 CreditBalanceCard

**Purpose**: Display current credit balance and quick actions

**Props**:
```typescript
interface CreditBalanceCardProps {
  balance: number;
  lastUpdated: Date;
  onTopUp: () => void;
  onViewTransactions: () => void;
}
```

**UI Elements**:
- Large credit balance display
- Currency formatting
- Last updated timestamp
- Quick top-up button
- Link to transaction history

**Features**:
- Animated balance updates
- Low balance warnings
- Currency conversion display
- Real-time updates via WebSocket

### 4.4 QuickActionsGrid

**Purpose**: Grid of quick action buttons for common tasks

**Props**:
```typescript
interface QuickActionsGridProps {
  onNewChat: () => void;
  onBuyCredits: () => void;
  onViewHistory: () => void;
  onProfile: () => void;
}
```

**UI Elements**:
- Grid layout (2x2 on desktop, 1x4 on mobile)
- Icon-based action buttons
- Hover effects and micro-interactions
- Descriptive labels

**Actions**:
- Start new chat session
- Buy more credits
- View usage history
- Edit profile settings

### 4.5 UsageChart

**Purpose**: Visual representation of usage over time

**Props**:
```typescript
interface UsageChartProps {
  data: UsageData[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}
```

**UI Elements**:
- Line chart or bar chart
- Date range selector (7D, 30D, 90D)
- Interactive tooltips
- Chart legend
- Export functionality

**Features**:
- Responsive chart sizing
- Multiple data series (credits used, API calls)
- Interactive data points
- Mobile-optimized touch interactions

### 4.6 RecentActivity

**Purpose**: List of recent user activities and transactions

**Props**:
```typescript
interface RecentActivityProps {
  activities: Activity[];
  onViewAll: () => void;
  loading?: boolean;
}
```

**UI Elements**:
- Scrollable activity list
- Activity items with icons
- Timestamps
- Activity type indicators
- "View all" link

**Activity Types**:
- Credit purchases
- Chat sessions
- API calls
- Account changes
- Login events

### 4.7 ServiceStatusBanner

**Purpose**: Display current service status and alerts

**Props**:
```typescript
interface ServiceStatusBannerProps {
  status: ServiceStatus;
  message?: string;
  onDismiss?: () => void;
}
```

**UI Elements**:
- Status indicator (green/yellow/red)
- Status message
- Dismiss button
- Link to status page

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface DashboardStore {
  // State
  user: User | null;
  creditBalance: number;
  usageData: UsageData[];
  recentActivity: Activity[];
  serviceStatus: ServiceStatus;
  isLoading: boolean;
  error: string | null;
  dateRange: DateRange;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  updateCreditBalance: (balance: number) => void;
  setUsageData: (data: UsageData[]) => void;
  setDateRange: (range: DateRange) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
}
```

### 5.2 Data Fetching Strategy

- Initial data fetch on component mount
- Periodic refresh every 5 minutes
- WebSocket for real-time updates
- Optimistic updates for better UX
- Request deduplication to prevent unnecessary calls

## 6. UI/UX Requirements

### 6.1 Responsive Design

- **Desktop (1200px+)**: 3-column layout with full charts
- **Tablet (768px-1199px)**: 2-column layout with compact charts
- **Mobile (<768px)**: Single column with stacked cards

### 6.2 Loading States

- Skeleton screens for all data cards
- Shimmer effects for charts
- Loading spinners for async operations
- Progressive content loading

### 6.3 Error Handling

- Error boundary for the entire dashboard
- Retry buttons for failed data fetches
- Offline mode indicator
- Graceful degradation for missing data

### 6.4 Micro-interactions

- Smooth transitions between states
- Hover effects on interactive elements
- Animated number counters
- Progress indicators for loading

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Semantic Structure

- Proper heading hierarchy
- Landmark regions (header, main, navigation)
- Semantic HTML5 elements
- ARIA labels where needed

### 7.2 Keyboard Navigation

- Tab order follows visual layout
- Focus indicators on all interactive elements
- Skip navigation links
- Keyboard shortcuts for common actions

### 7.3 Screen Reader Support

- Announcements for dynamic content updates
- Alternative text for charts and graphs
- Table headers for data tables
- Descriptive link text

## 8. Data Visualization

### 8.1 Chart Requirements

- Color-blind friendly palette
- High contrast for visibility
- Text alternatives for screen readers
- Touch-friendly interactions on mobile

### 8.2 Chart Types

- **Line Chart**: Usage over time
- **Bar Chart**: Daily/weekly comparison
- **Pie Chart**: Service usage breakdown
- **Area Chart**: Cumulative usage

## 9. Performance Considerations

### 9.1 Optimization Strategies

- Component lazy loading
- Chart virtualization for large datasets
- Image optimization for avatars
- Debounced resize handlers

### 9.2 Bundle Optimization

- Code splitting for chart libraries
- Dynamic imports for heavy components
- Tree shaking for unused dependencies
- Minimal impact on initial load

## 10. API Integration

### 10.1 Required Endpoints

- `GET /api/dashboard` - Dashboard summary data
- `GET /api/credits/balance` - Current credit balance
- `GET /api/usage/history` - Usage history data
- `GET /api/activities/recent` - Recent activities
- `GET /api/service/status` - Service status

### 10.2 WebSocket Events

- `credit_balance_updated` - Real-time balance updates
- `new_activity` - New activity notifications
- `service_status_changed` - Service status updates

## 11. Testing Requirements

### 11.1 Unit Tests

- Component rendering
- State management actions
- Utility functions
- Data formatting

### 11.2 Integration Tests

- Data fetching flows
- Component interactions
- WebSocket connections
- Error scenarios

### 11.3 E2E Tests

- Complete dashboard loading
- User interactions
- Responsive behavior
- Accessibility compliance

## 12. Wireframes

### 12.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header                    [User] [Notifications(3)]    │
├─────────────────────────────────────────────────────────┤
│ Welcome back, User!                                    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │   Credits   │ │   Usage     │ │   Status    │        │
│ │   $100.50   │ │   Chart     │ │   Online    │        │
│ │ [Top Up]    │ │             │ │             │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ New Chat    │ │ Buy Credits │ │ History     │        │
│ │    [→]      │ │    [→]      │ │    [→]      │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│ Recent Activity                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ • Chat session completed - 5 credits used          │ │
│ │ • Credits purchased - $20 added                    │ │
│ │ • API call - GPT-4 - 2 credits used               │ │
│ │ [View all activities]                              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 12.2 Mobile Layout

```
┌─────────────────┐
│ [Menu] Dashboard │
├─────────────────┤
│ Welcome, User!  │
├─────────────────┤
│ ┌─────────────┐ │
│ │   Credits   │ │
│ │   $100.50   │ │
│ │   [Top Up]  │ │
│ └─────────────┘ │
├─────────────────┤
│ ┌─────────────┐ │
│ │   Usage     │ │
│ │   Chart     │ │
│ │             │ │
│ └─────────────┘ │
├─────────────────┤
│ Quick Actions   │
│ ┌───┐ ┌───┐ ┌───┐ │
│ │Chat│ │Buy │ │Hist│ │
│ │    │ │    │ │    │ │
│ └───┘ └───┘ └───┘ │
├─────────────────┤
│ Recent Activity │
│ • Chat session  │
│ • Credits added │
│ • API call      │
│ [View all]      │
└─────────────────┘
```

## 13. Implementation Checklist

- [ ] Create DashboardPage component
- [ ] Implement DashboardHeader
- [ ] Create CreditBalanceCard
- [ ] Implement QuickActionsGrid
- [ ] Create UsageChart component
- [ ] Implement RecentActivity
- [ ] Create ServiceStatusBanner
- [ ] Set up Zustand dashboard store
- [ ] Implement data fetching
- [ ] Add WebSocket integration
- [ ] Ensure responsive design
- [ ] Add accessibility features
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create Storybook stories
- [ ] Performance optimization
- [ ] Error handling implementation

---

**หมายเหตุ:** เอกสารนี้เป็นส่วนหนึ่งของ Frontend Specifications และจะถูกอัปเดตตามความจำเป็น