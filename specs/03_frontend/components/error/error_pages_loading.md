---
title: "Error Pages and Loading States Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["FR-013-Error-Handling", "FR-014-Loading-States", "FR-015-User-Experience"]
---

# Error Pages and Loading States Components

## 1. ภาพรวม (Overview)

Error Pages and Loading States components provide comprehensive error handling and loading feedback for the Smart AI Hub platform. These components ensure users receive clear feedback during error conditions and loading states, maintaining a positive user experience even during system issues.

## 2. วัตถุประสงค์ (Objectives)

- ให้การแสดงผลข้อผิดพลาดที่ชัดเจนและเป็นมิตรกับผู้ใช้
- ให้ข้อมูลโหลดที่ดีและให้ข้อมูลแก่ผู้ใช้
- จัดการสถานการณ์ข้อผิดพลาดต่างๆ อย่างเหมาะสม
- ให้ทางเลือกการกู้คืนที่เป็นประโยชน์
- รักษาประสบการณ์ผู้ใช้ที่สม่ำเสมอแม้ในสถานการณ์ที่ไม่ดี

## 3. Component Hierarchy

```
ErrorAndLoadingProvider
├── Error Pages
│   ├── NotFoundPage
│   ├── ServerErrorPage
│   ├── NetworkErrorPage
│   ├── UnauthorizedPage
│   ├── ForbiddenPage
│   └── MaintenancePage
├── Error Components
│   ├── ErrorBoundary
│   ├── ErrorMessage
│   ├── ErrorAlert
│   ├── RetryButton
│   └── ErrorReporting
├── Loading Components
│   ├── LoadingSpinner
│   ├── LoadingBar
│   ├── SkeletonScreen
│   ├── ProgressIndicator
│   └── LazyLoader
├── Empty States
│   ├── EmptyState
│   ├── NoDataState
│   ├── NoSearchResults
│   └── FirstTimeState
└── Status Components
    ├── StatusIndicator
    ├── ConnectivityStatus
    ├── ServiceStatus
    └── SystemHealth
```

## 4. Component Specifications

### 4.1 ErrorBoundary

**Purpose**: Catches JavaScript errors in component tree and displays fallback UI

**Props**:
```typescript
interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReset?: boolean;
  reportErrors?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

**Features**:
- Catches runtime errors
- Custom fallback UI
- Error reporting integration
- Reset functionality
- Development vs production behavior

### 4.2 NotFoundPage

**Purpose**: 404 Not Found error page

**Props**:
```typescript
interface NotFoundPageProps {
  title?: string;
  message?: string;
  showSearch?: boolean;
  showHomeButton?: boolean;
  suggestedLinks?: Array<{ label: string; href: string }>;
  className?: string;
}
```

**UI Elements**:
- 404 error illustration
- Clear error message
- Search functionality
- Navigation suggestions
- Home button

**Features**:
- Helpful navigation options
- Search functionality
- Customizable content
- SEO optimization
- Accessibility support

### 4.3 ServerErrorPage

**Purpose**: 500 Internal Server Error page

**Props**:
```typescript
interface ServerErrorPageProps {
  errorCode?: number;
  title?: string;
  message?: string;
  showRetry?: boolean;
  showContact?: boolean;
  onRetry?: () => void;
  className?: string;
}
```

**UI Elements**:
- Error code display
- Apologetic messaging
- Retry button
- Contact support options
- Status indicator

**Features**:
- Retry functionality
- Error reporting
- Contact options
- Status monitoring
- User-friendly messaging

### 4.4 NetworkErrorPage

**Purpose**: Network connectivity error page

**Props**:
```typescript
interface NetworkErrorPageProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  showOfflineIndicator?: boolean;
  onRetry?: () => void;
  onReconnect?: () => void;
  className?: string;
}
```

**UI Elements**:
- Network error illustration
- Connection status indicator
- Retry button
- Offline mode options
- Auto-retry indicator

**Features**:
- Connection status monitoring
- Auto-retry functionality
- Offline mode support
- Progressive enhancement
- Real-time status updates

### 4.5 LoadingSpinner

**Purpose**: Animated loading spinner component

**Props**:
```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'current';
  variant?: 'default' | 'dots' | 'pulse' | 'bars';
  centered?: boolean;
  overlay?: boolean;
  label?: string;
  className?: string;
}
```

**Variants**:
- Default: Circular spinner
- Dots: Animated dots
- Pulse: Pulsing animation
- Bars: Animated bars

**Features**:
- Multiple animation types
- Size variations
- Color customization
- Accessibility labels
- Overlay support

### 4.6 SkeletonScreen

**Purpose**: Skeleton placeholder for content while loading

**Props**:
```typescript
interface SkeletonScreenProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'custom';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
  className?: string;
}
```

**Variants**:
- Text: Line placeholders
- Rectangular: Box placeholders
- Circular: Avatar placeholders
- Custom: Custom shapes

**Features**:
- Content-aware placeholders
- Smooth animations
- Multiple shapes
- Responsive design
- Performance optimized

### 4.7 LoadingBar

**Purpose**: Progress bar for loading operations

**Props**:
```typescript
interface LoadingBarProps {
  progress?: number;
  indeterminate?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  label?: string;
  className?: string;
}
```

**Features**:
- Determinate and indeterminate modes
- Color variants
- Progress labels
- Smooth animations
- Accessibility support

### 4.8 EmptyState

**Purpose**: Empty state component for no data scenarios

**Props**:
```typescript
interface EmptyStateProps {
  illustration?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'detailed';
  className?: string;
}
```

**Variants**:
- Default: Standard empty state
- Minimal: Simple empty state
- Detailed: Rich empty state with actions

**Features**:
- Customizable illustrations
- Action buttons
- Helpful messaging
- Contextual content
- Multiple variants

### 4.9 ErrorMessage

**Purpose**: Inline error message component

**Props**:
```typescript
interface ErrorMessageProps {
  error: string | Error;
  variant?: 'inline' | 'toast' | 'banner';
  severity?: 'info' | 'warning' | 'error' | 'critical';
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
  className?: string;
}
```

**Variants**:
- Inline: Inline error display
- Toast: Toast notification
- Banner: Page banner

**Features**:
- Multiple display modes
- Severity levels
- Dismissible option
- Action buttons
- Accessibility support

### 4.10 RetryButton

**Purpose**: Retry button component for error recovery

**Props**:
```typescript
interface RetryButtonProps {
  onRetry: () => void;
  loading?: boolean;
  disabled?: boolean;
  countdown?: number;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}
```

**Features**:
- Retry functionality
- Loading state
- Countdown timer
- Auto-retry option
- Multiple variants

## 5. Error Handling Strategy

### 5.1 Error Classification

```typescript
enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  MAINTENANCE = 'maintenance',
}

interface AppError {
  type: ErrorType;
  code?: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
}
```

### 5.2 Error Recovery Patterns

- Retry mechanisms
- Fallback content
- Graceful degradation
- Offline support
- User guidance

## 6. Loading State Management

### 6.1 Loading States

```typescript
interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
  indeterminate?: boolean;
  startTime?: Date;
  timeout?: number;
}
```

### 6.2 Progressive Loading

- Skeleton screens
- Lazy loading
- Code splitting
- Progressive enhancement
- Performance optimization

## 7. Accessibility Features

### 7.1 Screen Reader Support

- ARIA live regions
- Error announcements
- Loading state announcements
- Progress indicators
- Context information

### 7.2 Keyboard Navigation

- Focus management
- Skip navigation
- Tab order
- Shortcut keys
- Focus indicators

## 8. Performance Considerations

### 8.1 Optimization Strategies

- Lazy loading of error pages
- Optimized animations
- Minimal bundle impact
- Efficient state management
- Memory management

### 8.2 User Experience

- Fast error recovery
- Minimal disruption
- Clear feedback
- Helpful guidance
- Consistent behavior

## 9. Internationalization

### 9.1 Error Messages

- Localized error messages
- Culturally appropriate illustrations
- Right-to-left support
- Character set optimization
- Contextual translations

### 9.2 Loading Messages

- Localized loading text
- Culturally appropriate animations
- Accessibility translations
- Consistent terminology

## 10. Analytics and Monitoring

### 10.1 Error Tracking

- Error logging
- User impact analysis
- Performance metrics
- Recovery rates
- User feedback

### 10.2 Performance Monitoring

- Loading time tracking
- Error rate monitoring
- User experience metrics
- System health indicators
- Real-time alerts

## 11. Wireframes

### 11.1 404 Not Found Page

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     404                                 │
│                   Page Not Found                        │
│                                                         │
│              [Illustration of lost page]                │
│                                                         │
│        The page you're looking for doesn't exist       │
│                 or has been moved.                      │
│                                                         │
│           [Search pages]    [Go to Homepage]            │
│                                                         │
│               You might be interested in:               │
│         • Dashboard  • Profile  • Settings              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Server Error Page

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    Something went wrong                 │
│                                                         │
│              [Illustration of broken server]            │
│                                                         │
│        We're experiencing technical difficulties.        │
│        Our team has been notified and is working       │
│                 on a fix right now.                     │
│                                                         │
│                   Error Code: 500                       │
│                                                         │
│              [Try Again]    [Contact Support]           │
│                                                         │
│               Last checked: 2 minutes ago               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 11.3 Network Error Page

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                 Connection Lost                         │
│                                                         │
│            [Illustration of disconnected network]       │
│                                                         │
│          You're not connected to the internet.          │
│          Please check your connection and try again.    │
│                                                         │
│                                                         │
│    Status: Offline    Last check: Just now              │
│                                                         │
│              [Retry]    [Go Offline]                   │
│                                                         │
│         While offline, you can still access:           │
│         • Cached pages  • Settings  • Help             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 11.4 Loading State Examples

```
Skeleton Loading:
┌─────────────────────────────────────────────────────────┐
│ ████████████████                                   │ │
│ ████████████████████████████████████████████████   │ │
│ █████████████████                                   │ │
│                                                     │ │
│ ████████████████████████████  ████████████████████ │ │
│ ████████████████████         ████████████████████████ │ │
│ ████████████████████████████  ████████████████████ │ │
└─────────────────────────────────────────────────────────┘

Loading Spinner:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     Loading...                         │
│                                                         │
│                   [Circular Spinner]                   │
│                                                         │
│                Please wait while we                    │
│                 process your request.                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Empty State:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              [Illustration of empty box]               │
│                                                         │
│                 No data to display                     │
│                                                         │
│          You haven't created any projects yet.         │
│         Get started by creating your first project.    │
│                                                         │
│              [Create Project]  [Learn More]            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 12. Implementation Checklist

- [ ] Create ErrorAndLoadingProvider with context
- [ ] Implement ErrorBoundary component
- [ ] Implement NotFoundPage component
- [ ] Implement ServerErrorPage component
- [ ] Implement NetworkErrorPage component
- [ ] Implement UnauthorizedPage component
- [ ] Implement ForbiddenPage component
- [ ] Implement MaintenancePage component
- [ ] Implement LoadingSpinner component
- [ ] Implement SkeletonScreen component
- [ ] Implement LoadingBar component
- [ ] Implement EmptyState component
- [ ] Implement ErrorMessage component
- [ ] Implement RetryButton component
- [ ] Add error handling logic
- [ ] Implement loading state management
- [ ] Ensure accessibility compliance
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create Storybook stories
- [ ] Performance optimization
- [ ] Cross-browser testing

---

**หมายเหตุ:** เอกสารนี้เป็นส่วนหนึ่งของ Frontend Specifications และจะถูกอัปเดตตามความจำเป็น