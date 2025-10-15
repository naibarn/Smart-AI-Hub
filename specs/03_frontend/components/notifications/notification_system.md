---
title: "Notification System Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["FR-005-Notifications", "FR-006-Real-Time-Updates"]
---

# Notification System Components

## 1. ภาพรวม (Overview)

Notification System components provide comprehensive notification functionality for the Smart AI Hub platform. These components handle real-time notifications, notification preferences, notification history, and multi-channel delivery (in-app, email, push).

## 2. วัตถุประสงค์ (Objectives)

- ให้การแจ้งเตือนแบบ real-time แก่ผู้ใช้
- จัดการการตั้งค่าความชอบสำหรับการแจ้งเตือน
- จัดเก็บประวัติการแจ้งเตือน
- รองรับช่องทางการแจ้งเตือนหลายช่องทาง
- ให้ประสบการณ์ผู้ใช้ที่สม่ำเสมอและไม่รบกวน

## 3. Component Hierarchy

```
NotificationProvider
├── NotificationBell
│   ├── BadgeIndicator
│   ├── NotificationDropdown
│   │   ├── NotificationList
│   │   ├── NotificationItem
│   │   ├── NotificationActions
│   │   └── NotificationFilters
│   └── MarkAllReadButton
├── NotificationCenter
│   ├── NotificationCenterHeader
│   │   ├── Title
│   │   ├── SearchBar
│   │   ├── FilterDropdown
│   │   └── SettingsButton
│   ├── NotificationCenterContent
│   │   ├── NotificationTabs
│   │   ├── NotificationGroups
│   │   ├── NotificationList
│   │   └── LoadMoreButton
│   └── NotificationCenterFooter
│       ├── BulkActions
│       └── Pagination
├── NotificationToast
│   ├── ToastContainer
│   ├── ToastItem
│   │   ├── ToastIcon
│   │   ├── ToastContent
│   │   ├── ToastActions
│   │   └── ToastCloseButton
│   └── ToastProgress
├── NotificationSettings
│   ├── SettingsHeader
│   ├── SettingsCategories
│   │   ├── EmailNotifications
│   │   ├── PushNotifications
│   │   ├── InAppNotifications
│   │   └── NotificationFrequency
│   ├── SettingsForm
│   └── SettingsActions
├── NotificationComposer
│   ├── ComposerHeader
│   ├── RecipientSelector
│   ├── MessageEditor
│   ├── ScheduleOptions
│   └── PreviewSection
└── NotificationTemplates
    ├── TemplateList
    ├── TemplateEditor
    ├── TemplateVariables
    └── TemplatePreview
```

## 4. Component Specifications

### 4.1 NotificationProvider

**Purpose**: Provides notification context and state management

**Props**: None

**State**:
```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings;
  templates: NotificationTemplate[];
}

interface NotificationContextValue extends NotificationState {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  sendNotification: (notification: CreateNotificationData) => Promise<void>;
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  clearError: () => void;
}
```

**Features**:
- Real-time notification updates via WebSocket
- Notification persistence
- Settings synchronization
- Offline notification handling

### 4.2 NotificationBell

**Purpose**: Bell icon in header showing notification count

**Props**:
```typescript
interface NotificationBellProps {
  onClick?: () => void;
  showBadge?: boolean;
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}
```

**UI Elements**:
- Bell icon with animation
- Badge showing unread count
- Click to open dropdown
- Hover effects

**Features**:
- Real-time count updates
- Badge animations
- Accessibility support
- Keyboard navigation

### 4.3 NotificationDropdown

**Purpose**: Dropdown panel showing recent notifications

**Props**:
```typescript
interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
  maxItems?: number;
  className?: string;
}
```

**UI Elements**:
- List of recent notifications
- Mark all as read button
- View all notifications link
- Notification filters
- Empty state

**Features**:
- Infinite scroll
- Real-time updates
- Quick actions
- Keyboard navigation

### 4.4 NotificationCenter

**Purpose**: Full-page notification center for managing all notifications

**Props**:
```typescript
interface NotificationCenterProps {
  initialFilter?: NotificationFilter;
  onNotificationSelect?: (notification: Notification) => void;
  className?: string;
}
```

**UI Elements**:
- Search and filter controls
- Notification tabs (All, Unread, Mentions, etc.)
- Grouped notifications by date
- Bulk action controls
- Pagination

**Features**:
- Advanced filtering
- Search functionality
- Bulk operations
- Notification grouping
- Export functionality

### 4.5 NotificationToast

**Purpose**: Toast notifications for immediate alerts

**Props**:
```typescript
interface NotificationToastProps {
  notification: Notification;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
  className?: string;
}
```

**UI Elements**:
- Toast container with positioning
- Icon based on notification type
- Notification content
- Action buttons
- Progress indicator for auto-close
- Close button

**Features**:
- Auto-dismiss with progress bar
- Manual dismissal
- Action buttons
- Stacking multiple toasts
- Positioning options

### 4.6 NotificationSettings

**Purpose**: Interface for managing notification preferences

**Props**:
```typescript
interface NotificationSettingsProps {
  settings: NotificationSettings;
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>;
  categories: NotificationCategory[];
  className?: string;
}
```

**UI Elements**:
- Settings categories
- Toggle switches for notification types
- Frequency selectors
- Channel preferences (email, push, in-app)
- Quiet hours configuration
- Save/Cancel buttons

**Features**:
- Granular control over notifications
- Channel preferences
- Frequency settings
- Quiet hours
- Preview notifications

### 4.7 NotificationComposer

**Purpose**: Admin interface for composing notifications

**Props**:
```typescript
interface NotificationComposerProps {
  onSend: (notification: CreateNotificationData) => Promise<void>;
  onPreview: (notification: CreateNotificationData) => void;
  templates: NotificationTemplate[];
  className?: string;
}
```

**UI Elements**:
- Recipient selector (users, roles, segments)
- Message editor with rich text
- Template selector
- Scheduling options
- Preview mode
- Send/Test buttons

**Features**:
- Rich text editing
- Template system
- Recipient targeting
- Scheduling
- Preview functionality
- Variable substitution

### 4.8 NotificationItem

**Purpose**: Individual notification display component

**Props**:
```typescript
interface NotificationItemProps {
  notification: Notification;
  isRead: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}
```

**UI Elements**:
- Notification icon based on type
- Notification title and content
- Timestamp
- Read/unread indicator
- Action buttons
- Avatar for user notifications

**Features**:
- Rich content support
 elements
- Click actions
- Hover states
- Keyboard navigation

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings;
  templates: NotificationTemplate[];
  filters: NotificationFilters;
  searchQuery: string;
  
  // Actions
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  sendNotification: (notification: CreateNotificationData) => Promise<void>;
  sendBulkNotification: (notification: BulkNotificationData) => Promise<void>;
  updateTemplate: (id: string, template: Partial<NotificationTemplate>) => Promise<void>;
  createTemplate: (template: CreateNotificationTemplateData) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  
  // Actions - Real-time
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  handleRealtimeNotification: (notification: Notification) => void;
  
  // Actions - Filters
  updateFilters: (filters: Partial<NotificationFilters>) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  
  // Actions - General
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  refreshNotifications: () => Promise<void>;
  
  // Getters
  hasUnreadNotifications: boolean;
  unreadNotifications: Notification[];
  filteredNotifications: Notification[];
  notificationsByType: Record<string, Notification[]>;
  todaysNotifications: Notification[];
}
```

### 5.2 Real-time Updates

- WebSocket integration for live notifications
- Push notification support
- Event-driven architecture
- Connection status management
- Offline notification queuing

## 6. UI/UX Requirements

### 6.1 Responsive Design

- Mobile-first approach
- Breakpoints: xs (0px), sm (600px), md (960px), lg (1280px), xl (1920px)
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

### 6.2 Animation and Transitions

- Smooth notification appearance
- Badge count animations
- Toast animations
- Loading states
- Micro-interactions

### 6.3 Loading States

- Skeleton screens for notification lists
- Loading indicators for async operations
- Connection status indicators
- Progressive loading

### 6.4 Error Handling

- Network error recovery
- Connection failure handling
- Retry mechanisms
- Graceful degradation

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Semantic HTML

- Proper use of ARIA roles
- Live regions for dynamic content
- Semantic structure
- Landmark regions

### 7.2 Keyboard Navigation

- Full keyboard accessibility
- Tab order management
- Shortcut keys
- Focus management

### 7.3 Screen Reader Support

- Notification announcements
- Status updates
- Alternative text for icons
- Contextual information

## 8. Form Validation

### 8.1 Client-side Validation

- Real-time validation
- Form field validation
- Template validation
- Recipient validation

### 8.2 Validation Schema (Zod)

```typescript
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
  quietHours: z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  }),
  categories: z.record(z.string(), z.object({
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
    frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']),
  })),
});

const createNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required").max(1000),
  type: z.enum(['info', 'success', 'warning', 'error']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  recipients: z.array(z.string()).min(1, "At least one recipient is required"),
  channels: z.array(z.enum(['email', 'push', 'in_app'])).min(1, "At least one channel is required"),
  scheduledAt: z.date().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string(), z.any()).optional(),
});

const notificationTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(50),
  title: z.string().min(1, "Title template is required").max(100),
  content: z.string().min(1, "Content template is required").max(1000),
  type: z.enum(['info', 'success', 'warning', 'error']),
  category: z.string().min(1, "Category is required"),
  variables: z.array(z.object({
    name: z.string().min(1, "Variable name is required"),
    type: z.enum(['string', 'number', 'boolean', 'date']),
    required: z.boolean(),
    defaultValue: z.any().optional(),
  })),
});
```

## 9. API Integration

### 9.1 Endpoints

- `GET /api/notifications` - List notifications
- `GET /api/notifications/:id` - Get notification details
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/settings` - Get notification settings
- `PUT /api/notifications/settings` - Update notification settings
- `POST /api/notifications/send` - Send notification
- `POST /api/notifications/send-bulk` - Send bulk notification
- `GET /api/notifications/templates` - List notification templates
- `POST /api/notifications/templates` - Create notification template
- `PUT /api/notifications/templates/:id` - Update notification template
- `DELETE /api/notifications/templates/:id` - Delete notification template
- `GET /api/notifications/unread-count` - Get unread count

### 9.2 WebSocket Events

- `notification:new` - New notification received
- `notification:read` - Notification marked as read
- `notification:delete` - Notification deleted
- `notification:settings_updated` - Settings updated

### 9.3 Error Handling

- Validation error display
- Network error handling
- WebSocket error recovery
- Rate limiting handling

## 10. Testing Requirements

### 10.1 Unit Tests

- Form validation logic
- State management actions
- Utility functions
- Component rendering

### 10.2 Integration Tests

- Notification delivery
- Settings management
- Template system
- WebSocket integration

### 10.3 E2E Tests

- Complete notification flows
- Real-time notifications
- Settings updates
- Multi-channel delivery

## 11. Performance Considerations

### 11.1 Optimization Strategies

- Virtual scrolling for large lists
- Lazy loading of notification content
- Efficient state updates
- Debounced search

### 11.2 Bundle Optimization

- Code splitting for notification components
- Lazy loading of heavy dependencies
- Tree shaking for unused features
- Minimal impact on initial load

## 12. Security Considerations

### 12.1 Data Protection

- Secure notification content
- User privacy protection
- Rate limiting
- Input sanitization

### 12.2 Access Control

- Notification access permissions
- Settings access control
- Admin-only features
- Audit logging

## 13. Wireframes

### 13.1 Notification Bell with Dropdown (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│ Logo            Dashboard        [🔔3] [User▼]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                Notifications Dropdown                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔔 New user registration                         │   │
│  │    John Doe just joined the platform            │   │
│  │    2 minutes ago                     [Mark read]│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 💳 Payment received                            │   │
│  │    Jane Smith purchased Pro plan               │   │
│  │    1 hour ago                       [Mark read]│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ⚠️ System maintenance scheduled                │   │
│  │    Scheduled for tomorrow 2:00 AM             │   │
│  │    3 hours ago                      [Mark read]│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ [Mark all as read]    [View all notifications] │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 13.2 Notification Center (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│ ← Notifications                    [Search] [Filter▼]   │
├─────────────────────────────────────────────────────────┤
│ [All] [Unread] [Mentions] [System] [Billing]            │
├─────────────────────────────────────────────────────────┤
│ Today                                                  │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🔔 New user registration                         │   │
│ │    John Doe just joined the platform            │   │
│ │    2 minutes ago                     [Delete]   │   │
│ ├─────────────────────────────────────────────────┤   │
│ │ 💳 Payment received                            │   │
│ │    Jane Smith purchased Pro plan               │   │
│ │    1 hour ago                       [Delete]   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Yesterday                                              │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ⚠️ System maintenance scheduled                │   │
│ │    Scheduled for tomorrow 2:00 AM             │   │
│ │    3 hours ago                      [Delete]   │   │
│ └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│ [Mark all as read] [Delete selected]  [1-10 of 1,234] │
└─────────────────────────────────────────────────────────┘
```

### 13.3 Notification Settings (Mobile)

```
┌─────────────────────┐
│ ← Settings          │
├─────────────────────┤
│ Notification Settings│
├─────────────────────┤
│ Email Notifications │
│ ☑ Account updates   │
│ ☑ Billing alerts    │
│ ☐ Marketing emails  │
│                     │
│ Push Notifications  │
│ ☑ New messages      │
│ ☑ System alerts     │
│ ☐ Marketing         │
│                     │
│ Quiet Hours         │
│ ☑ Enabled           │
│ From: 10:00 PM      │
│ To:   8:00 AM       │
│                     │
│ [Save] [Cancel]     │
└─────────────────────┘
```

## 14. Implementation Checklist

- [ ] Create NotificationProvider with context
- [ ] Implement NotificationBell component
- [ ] Implement NotificationDropdown component
- [ ] Implement NotificationCenter component
- [ ] Implement NotificationToast component
- [ ] Implement NotificationSettings component
- [ ] Implement NotificationComposer component
- [ ] Implement NotificationItem component
- [ ] Create Zustand notification store
- [ ] Add WebSocket integration
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
- Interactive