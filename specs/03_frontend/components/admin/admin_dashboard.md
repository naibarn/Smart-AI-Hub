---
title: "Admin Dashboard Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["FR-002-Admin-Management", "FR-003-User-Management", "FR-004-System-Monitoring"]
---

# Admin Dashboard Components

## 1. ภาพรวม (Overview)

Admin Dashboard components provide comprehensive administrative functionality for managing the Smart AI Hub platform. These components enable administrators to monitor system health, manage users, handle financial operations, and configure platform settings.

## 2. วัตถุประสงค์ (Objectives)

- ให้ผู้ดูแลระบบสามารถจัดการผู้ใช้ได้อย่างมีประสิทธิภาพ
- ติดตามสถานะของระบบและประสิทธิภาพการทำงาน
- จัดการการเงินและธุรกรรมของแพลตฟอร์ม
- ควบคุมการตั้งค่าและการกำหนดค่าของระบบ
- ให้ข้อมูลเชิงลึกเกี่ยวกับการใช้งานแพลตฟอร์ม

## 3. Component Hierarchy

```
AdminDashboardProvider
├── AdminLayout
│   ├── AdminSidebar
│   │   ├── SidebarNavigation
│   │   ├── UserMenu
│   │   └── QuickActions
│   ├── AdminHeader
│   │   ├── SystemStatus
│   │   ├── NotificationsBell
│   │   ├── SearchBar
│   │   └── UserDropdown
│   └── AdminContent
├── DashboardOverview
│   ├── SystemMetrics
│   │   ├── MetricCards
│   │   ├── UsageCharts
│   │   └── RevenueCharts
│   ├── RecentActivity
│   │   ├── ActivityFeed
│   │   └── ActivityFilters
│   └── QuickActions
│       ├── ActionCards
│       └── ActionButtons
├── UserManagement
│   ├── UserList
│   │   ├── UserTable
│   │   ├── UserFilters
│   │   ├── UserSearch
│   │   └── UserBulkActions
│   ├── UserDetails
│   │   ├── UserInfo
│   │   ├── UserActivity
│   │   ├── UserCredits
│   │   └── UserSettings
│   └── UserCreation
│       ├── CreateUserForm
│       └── RoleAssignment
├── FinancialManagement
│   ├── TransactionsList
│   │   ├── TransactionTable
│   │   ├── TransactionFilters
│   │   └── TransactionDetails
│   ├── CreditManagement
│   │   ├── CreditAdjustment
│   │   ├── PromoCodeManagement
│   │   └── CreditAnalytics
│   └── BillingReports
│       ├── ReportGenerator
│       ├── ReportFilters
│       └── ReportExports
├── SystemMonitoring
│   ├── SystemHealth
│   │   ├── HealthIndicators
│   │   ├── ServiceStatus
│   │   └── PerformanceMetrics
│   ├── LogsViewer
│   │   ├── LogFilters
│   │   ├── LogTable
│   │   └── LogDetails
│   └── AlertsManagement
│       ├── AlertList
│       ├── AlertRules
│       └── NotificationSettings
└── SettingsManagement
    ├── PlatformSettings
    │   ├── GeneralSettings
    │   ├── SecuritySettings
    │   └── IntegrationSettings
    ├── RoleManagement
    │   ├── RoleList
    │   ├── RoleEditor
    │   └── PermissionMatrix
    └── ContentManagement
        ├── ContentModeration
        ├── TemplateManagement
        └── DocumentationEditor
```

## 4. Component Specifications

### 4.1 AdminDashboardProvider

**Purpose**: Provides admin dashboard context and state management

**Props**: None

**State**:
```typescript
interface AdminDashboardState {
  currentUser: AdminUser | null;
  systemStatus: SystemStatus;
  notifications: AdminNotification[];
  activeSection: string;
  isLoading: boolean;
  error: string | null;
  filters: Record<string, any>;
  searchQuery: string;
}

interface AdminDashboardContextValue extends AdminDashboardState {
  fetchSystemStatus: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  setActiveSection: (section: string) => void;
  updateFilters: (filters: Record<string, any>) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
  refreshData: () => Promise<void>;
}
```

**Features**:
- Real-time system status updates
- Notification management
- Global filter and search state
- Automatic data refresh

### 4.2 AdminLayout

**Purpose**: Main layout wrapper for admin dashboard

**Props**:
```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
}
```

**UI Elements**:
- Responsive sidebar navigation
- Top header with system status
- Main content area
- Breadcrumb navigation
- Footer with system info

**Features**:
- Collapsible sidebar
- Responsive design
- Keyboard shortcuts
- Theme switching

### 4.3 DashboardOverview

**Purpose**: Main dashboard with system metrics and quick actions

**Props**:
```typescript
interface DashboardOverviewProps {
  timeframe: 'day' | 'week' | 'month';
  onTimeframeChange: (timeframe: string) => void;
  className?: string;
}
```

**UI Elements**:
- Key metric cards (users, revenue, usage)
- Interactive charts and graphs
- Recent activity feed
- Quick action buttons
- System alerts

**Features**:
- Real-time data updates
- Interactive visualizations
- Drill-down capabilities
- Customizable widgets

### 4.4 UserList

**Purpose**: Displays and manages platform users

**Props**:
```typescript
interface UserListProps {
  initialFilters?: UserFilters;
  onUserSelect?: (user: User) => void;
  onBulkAction?: (action: string, users: string[]) => void;
  className?: string;
}
```

**UI Elements**:
- Searchable user table
- Advanced filtering options
- Bulk action controls
- Pagination
- Export functionality

**Features**:
- Real-time search
- Advanced filtering
- Bulk operations
- User status management
- Export to CSV/Excel

### 4.5 UserDetails

**Purpose**: Shows detailed information about a specific user

**Props**:
```typescript
interface UserDetailsProps {
  userId: string;
  onEdit?: (user: User) => void;
  onSuspend?: (userId: string) => void;
  onDelete?: (userId: string) => void;
  className?: string;
}
```

**UI Elements**:
- User profile information
- Account status indicators
- Credit balance and history
- Usage statistics
- Activity timeline
- Action buttons

**Features**:
- Comprehensive user view
- Quick actions
- Activity tracking
- Credit management
- Account controls

### 4.6 TransactionsList

**Purpose**: Displays and manages financial transactions

**Props**:
```typescript
interface TransactionsListProps {
  initialFilters?: TransactionFilters;
  onTransactionSelect?: (transaction: Transaction) => void;
  onRefund?: (transactionId: string) => void;
  className?: string;
}
```

**UI Elements**:
- Transaction table with details
- Filtering by date, status, type
- Search functionality
- Refund controls
- Export options

**Features**:
- Real-time transaction updates
- Advanced filtering
- Refund processing
- Dispute management
- Financial reporting

### 4.7 CreditManagement

**Purpose**: Manages user credits and promotional codes

**Props**:
```typescript
interface CreditManagementProps {
  onCreditAdjust?: (userId: string, amount: number) => void;
  onPromoCreate?: (promo: PromoCode) => void;
  className?: string;
}
```

**UI Elements**:
- Credit adjustment interface
- Promo code creation form
- Credit analytics charts
- Usage statistics
- Bulk operations

**Features**:
- Manual credit adjustments
- Promo code management
- Usage analytics
- Bulk credit operations
- Audit trail

### 4.8 SystemHealth

**Purpose**: Displays system health and performance metrics

**Props**:
```typescript
interface SystemHealthProps {
  refreshInterval?: number;
  onServiceAction?: (service: string, action: string) => void;
  className?: string;
}
```

**UI Elements**:
- Service status indicators
- Performance metrics
- Resource utilization
- Error rates
- Uptime statistics

**Features**:
- Real-time monitoring
- Service management
- Performance alerts
- Historical data
- Health recommendations

### 4.9 LogsViewer

**Purpose**: Displays and filters system logs

**Props**:
```typescript
interface LogsViewerProps {
  initialFilters?: LogFilters;
  onLogSelect?: (log: LogEntry) => void;
  onExport?: (logs: LogEntry[]) => void;
  className?: string;
}
```

**UI Elements**:
- Filterable log table
- Log level indicators
- Search functionality
- Log details modal
- Export controls

**Features**:
- Real-time log streaming
- Advanced filtering
- Log search
- Detailed view
- Export capabilities

### 4.10 RoleManagement

**Purpose**: Manages user roles and permissions

**Props**:
```typescript
interface RoleManagementProps {
  onRoleCreate?: (role: Role) => void;
  onRoleUpdate?: (role: Role) => void;
  onRoleDelete?: (roleId: string) => void;
  className?: string;
}
```

**UI Elements**:
- Role list with descriptions
- Permission matrix
- Role editor
- User role assignments
- Permission templates

**Features**:
- Role-based access control
- Permission management
- Role templates
- Bulk assignments
- Audit history

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface AdminStore {
  // State
  currentUser: AdminUser | null;
  systemStatus: SystemStatus;
  notifications: AdminNotification[];
  users: User[];
  transactions: Transaction[];
  logs: LogEntry[];
  roles: Role[];
  metrics: SystemMetrics;
  isLoading: boolean;
  error: string | null;
  filters: AdminFilters;
  
  // Actions
  fetchUsers: (filters?: UserFilters) => Promise<void>;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchLogs: (filters?: LogFilters) => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchSystemMetrics: () => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  suspendUser: (userId: string, reason: string) => Promise<void>;
  adjustCredits: (userId: string, amount: number, reason: string) => Promise<void>;
  createPromoCode: (promo: CreatePromoCodeData) => Promise<void>;
  processRefund: (transactionId: string, reason: string) => Promise<void>;
  updateRole: (roleId: string, data: Partial<Role>) => Promise<void>;
  createRole: (role: CreateRoleData) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  updateSystemSettings: (settings: SystemSettings) => Promise<void>;
  
  // Actions - Notifications
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Actions - Filters
  updateFilters: (filters: Partial<AdminFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  
  // Actions - General
  refreshData: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Getters
  hasUnreadNotifications: boolean;
  activeUsersCount: number;
  systemHealthScore: number;
  todaysRevenue: number;
  criticalAlerts: AdminNotification[];
}
```

### 5.2 Real-time Updates

- WebSocket integration for live data
- Optimistic updates with rollback
- Conflict resolution
- Offline detection

## 6. UI/UX Requirements

### 6.1 Responsive Design

- Desktop-first approach with mobile support
- Breakpoints: xs (0px), sm (600px), md (960px), lg (1280px), xl (1920px)
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

### 6.2 Data Visualization

- Interactive charts and graphs
- Real-time data updates
- Drill-down capabilities
- Export functionality

### 6.3 Loading States

- Skeleton screens for data tables
- Progress indicators for operations
- Loading states for async operations
- Smooth transitions

### 6.4 Error Handling

- Inline error messages
- Toast notifications for API errors
- Error boundaries for component errors
- Network error recovery

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Semantic HTML

- Proper use of tables for data
- ARIA labels and descriptions
- Logical heading structure
- Landmark regions

### 7.2 Keyboard Navigation

- Full keyboard accessibility
- Tab order management
- Shortcut keys for common actions
- Focus management

### 7.3 Screen Reader Support

- Table headers and captions
- Form labels and descriptions
- Status announcements
- Data table navigation

## 8. Form Validation

### 8.1 Client-side Validation

- Real-time validation
- Debounced validation
- Custom validation rules
- Cross-field validation

### 8.2 Validation Schema (Zod)

```typescript
const userCreationSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.string().min(1, "Role is required"),
  initialCredits: z.number().min(0, "Credits must be non-negative"),
});

const creditAdjustmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number(),
  reason: z.string().min(1, "Reason is required").max(500),
}).refine(data => data.amount !== 0, {
  message: "Amount cannot be zero",
});

const promoCodeSchema = z.object({
  code: z.string().min(1, "Code is required").max(20),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().min(0, "Value must be positive"),
  maxUses: z.number().min(1, "Max uses must be at least 1"),
  expiresAt: z.date().min(new Date(), "Expiry date must be in the future"),
});
```

## 9. API Integration

### 9.1 Endpoints

- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/suspend` - Suspend user
- `GET /api/admin/transactions` - List transactions
- `GET /api/admin/transactions/:id` - Get transaction details
- `POST /api/admin/transactions/:id/refund` - Process refund
- `GET /api/admin/logs` - Get system logs
- `GET /api/admin/metrics` - Get system metrics
- `GET /api/admin/roles` - List roles
- `POST /api/admin/roles` - Create role
- `PUT /api/admin/roles/:id` - Update role
- `DELETE /api/admin/roles/:id` - Delete role
- `POST /api/admin/credits/adjust` - Adjust user credits
- `POST /api/admin/promo-codes` - Create promo code
- `GET /api/admin/system/health` - Get system health
- `GET /api/admin/notifications` - Get admin notifications

### 9.2 Error Handling

- Validation error display
- Network error handling
- Permission error handling
- Rate limiting handling

## 10. Testing Requirements

### 10.1 Unit Tests

- Form validation logic
- State management actions
- Utility functions
- Component rendering

### 10.2 Integration Tests

- User management flows
- Transaction processing
- Credit adjustments
- Role management

### 10.3 E2E Tests

- Complete admin workflows
- User lifecycle management
- Financial operations
- System monitoring

## 11. Performance Considerations

### 11.1 Data Management

- Pagination for large datasets
- Virtual scrolling for tables
- Efficient data fetching
- Caching strategies

### 11.2 Bundle Optimization

- Code splitting for admin sections
- Lazy loading of chart libraries
- Tree shaking for unused dependencies
- Minimal impact on initial load

## 12. Security Considerations

### 12.1 Access Control

- Role-based access control
- Permission checking
- Secure API endpoints
- Audit logging

### 12.2 Data Protection

- Secure data transmission
- Sensitive data masking
- Rate limiting
- Input sanitization

## 13. Wireframes

### 13.1 Admin Dashboard Overview (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                    [🔔] [Admin▼] │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                                     │
│─────────├───────────────────────────────────────────────────────┤
│ Overview │ System Metrics                                        │
│ Users    │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ Finance  │ │Users│ │Rev  │ │Usage│ │Alert│                    │
│ Monitor  │ └─────┘ └─────┘ └─────┘ └─────┘                    │
│ Settings │                                                        │
│         │ Usage Charts                                           │
│         │ ┌─────────────────────────────────────────────────┐   │
│         │ │        Bar Chart showing daily usage           │   │
│         │ └─────────────────────────────────────────────────┘   │
│         │                                                        │
│         │ Recent Activity                                        │
│         │ ┌─────────────────────────────────────────────────┐   │
│         │ │ • User John Doe registered                     │   │
│         │ │ • Payment $50 received from Jane Smith         │   │
│         │ │ • System alert: High CPU usage detected        │   │
│         │ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 User Management View

```
┌─────────────────────────────────────────────────────────────────┐
│ Users                                               [Search box] │
├─────────────────────────────────────────────────────────────────┤
│ Filters: [Status▼] [Role▼] [Date range] [Apply] [Clear]        │
├─────────────────────────────────────────────────────────────────┤
│ ☐  Name          Email           Role    Status    Credits      │
│ ☐  John Doe      john@...       User    Active    1,250        │
│ ☐  Jane Smith    jane@...       Admin   Active    5,000        │
│ ☐  Bob Johnson   bob@...        User    Suspended  750         │
│ ☐  ...           ...            ...     ...       ...          │
├─────────────────────────────────────────────────────────────────┤
│ [Suspend] [Delete] [Adjust Credits] [Export]  [1-10 of 1,234] │
└─────────────────────────────────────────────────────────────────┘
```

## 14. Implementation Checklist

- [ ] Create AdminDashboardProvider with context
- [ ] Implement AdminLayout component
- [ ] Implement DashboardOverview component
- [ ] Implement UserList component
- [ ] Implement UserDetails component
- [ ] Implement TransactionsList component
- [ ] Implement CreditManagement component
- [ ] Implement SystemHealth component
- [ ] Implement LogsViewer component
- [ ] Implement RoleManagement component
- [ ] Create Zustand admin store
- [ ] Add form validation with Zod
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Ensure accessibility compliance
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create Storybook stories
- [ ] Performance optimization
- [ ] Security review

---

**หมายเหตุ:** เอกสารนี้เป็นส่วนหนึ่งของ Frontend Specifications และจะถูกอัปเดตตามความจำเป็น