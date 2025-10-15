---
title: "Layout Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["FR-007-Layout", "FR-008-Navigation", "FR-009-Responsive-Design"]
---

# Layout Components

## 1. ภาพรวม (Overview)

Layout components provide the structural foundation for the Smart AI Hub platform. These components handle navigation, responsive layouts, breadcrumbs, and overall page structure, ensuring consistent user experience across all pages.

## 2. วัตถุประสงค์ (Objectives)

- ให้โครงสร้างเลย์เอาต์ที่สม่ำเสมอทั่วทั้งแพลตฟอร์ม
- รองรับการนำทางที่ใช้งานง่ายและเป็นมิตรกับผู้ใช้
- ให้การตอบสนองที่ดีกับอุปกรณ์ทุกขนาด
- จัดการสถานะการนำทางและตำแหน่งปัจจุบัน
- ให้ประสบการณ์ผู้ใช้ที่สม่ำเสมอและเป็นมิตร

## 3. Component Hierarchy

```
LayoutProvider
├── AppLayout
│   ├── AppHeader
│   │   ├── Logo
│   │   ├── HeaderNavigation
│   │   ├── UserMenu
│   │   │   ├── UserProfile
│   │   │   ├── NotificationBell
│   │   │   └── SettingsDropdown
│   │   └── MobileMenuToggle
│   ├── AppSidebar
│   │   ├── SidebarHeader
│   │   ├── SidebarNavigation
│   │   │   ├── NavigationItems
│   │   │   ├── NavigationGroups
│   │   │   └── NavigationFooter
│   │   └── SidebarCollapseButton
│   ├── AppContent
│   │   ├── PageHeader
│   │   │   ├── PageTitle
│   │   │   ├── PageActions
│   │   │   └── BreadcrumbNavigation
│   │   ├── PageContent
│   │   └── PageFooter
│   └── AppFooter
│       ├── FooterLinks
│       ├── FooterInfo
│       └── FooterLegal
├── AdminLayout
│   ├── AdminHeader
│   ├── AdminSidebar
│   ├── AdminContent
│   └── AdminFooter
├── AuthLayout
│   ├── AuthHeader
│   ├── AuthContent
│   └── AuthFooter
└── NavigationProvider
    ├── NavigationContext
    ├── NavigationActions
    └── NavigationState
```

## 4. Component Specifications

### 4.1 LayoutProvider

**Purpose**: Provides layout context and state management

**Props**: None

**State**:
```typescript
interface LayoutState {
  sidebarCollapsed: boolean;
  isMobile: boolean;
  currentPath: string;
  navigationItems: NavigationItem[];
  breadcrumbs: BreadcrumbItem[];
  isDarkMode: boolean;
  isLoading: boolean;
}

interface LayoutContextValue extends LayoutState {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  navigateTo: (path: string) => void;
  updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  toggleDarkMode: () => void;
  setLoading: (loading: boolean) => void;
}
```

**Features**:
- Global layout state management
- Responsive behavior handling
- Navigation state tracking
- Theme management

### 4.2 AppLayout

**Purpose**: Main application layout wrapper

**Props**:
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
  headerVariant?: 'default' | 'minimal' | 'transparent';
  sidebarVariant?: 'default' | 'compact' | 'expanded';
  className?: string;
}
```

**UI Elements**:
- Responsive header with navigation
- Collapsible sidebar
- Main content area
- Footer with links
- Mobile navigation drawer

**Features**:
- Responsive design
- Collapsible sidebar
- Mobile navigation
- Breadcrumb support
- Theme switching

### 4.3 AppHeader

**Purpose**: Main application header with navigation and user controls

**Props**:
```typescript
interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showNavigation?: boolean;
  showUserMenu?: boolean;
  showNotifications?: boolean;
  variant?: 'default' | 'minimal' | 'transparent';
  className?: string;
}
```

**UI Elements**:
- Company logo and home link
- Primary navigation menu
- Search bar (optional)
- Notification bell
- User profile dropdown
- Mobile menu toggle

**Features**:
- Sticky header option
- Search functionality
- User authentication status
- Responsive navigation
- Theme switcher

### 4.4 AppSidebar

**Purpose**: Main navigation sidebar with menu items

**Props**:
```typescript
interface AppSidebarProps {
  navigationItems: NavigationItem[];
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  variant?: 'default' | 'compact' | 'expanded';
  className?: string;
}
```

**UI Elements**:
- Sidebar header with logo
- Navigation menu items
- Navigation groups
- Active item indicators
- Collapse toggle button
- Footer with additional links

**Features**:
- Hierarchical navigation
- Active state management
- Collapsible design
- Icon and text labels
- Keyboard navigation

### 4.5 NavigationItem

**Purpose**: Individual navigation menu item

**Props**:
```typescript
interface NavigationItemProps {
  item: NavigationItem;
  isActive?: boolean;
  level?: number;
  onNavigate?: (path: string) => void;
  className?: string;
}
```

**UI Elements**:
- Icon (optional)
- Text label
- Badge/indicator (optional)
- Expand/collapse icon (for groups)
- Active state indicator

**Features**:
- Hierarchical display
- Active state highlighting
- Badge support
- Keyboard navigation
- Tooltips

### 4.6 BreadcrumbNavigation

**Purpose**: Breadcrumb trail showing current navigation path

**Props**:
```typescript
interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  separator?: string | React.ReactNode;
  maxItems?: number;
  showHome?: boolean;
  className?: string;
}
```

**UI Elements**:
- Breadcrumb items with links
- Separator between items
- Home icon/item
- Overflow indicator for long paths
- Current page indicator

**Features**:
- Automatic truncation
- Clickable navigation
- Home link
- Responsive display
- SEO friendly

### 4.7 PageHeader

**Purpose**: Page-specific header with title and actions

**Props**:
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backAction?: () => void;
  className?: string;
}
```

**UI Elements**:
- Page title
- Subtitle/description
- Breadcrumb navigation
- Action buttons
- Back navigation (optional)

**Features**:
- Consistent page structure
- Action area for page-specific controls
- Back navigation
- Breadcrumb integration
- Responsive layout

### 4.8 AppFooter

**Purpose**: Application footer with links and information

**Props**:
```typescript
interface AppFooterProps {
  showLinks?: boolean;
  showLegal?: boolean;
  showSocial?: boolean;
  variant?: 'default' | 'minimal' | 'compact';
  className?: string;
}
```

**UI Elements**:
- Company information
- Navigation links
- Legal links (privacy, terms)
- Social media links
- Copyright information

**Features**:
- Multi-column layout
- Legal compliance
- Brand consistency
- Responsive design
- Accessibility support

### 4.9 AdminLayout

**Purpose**: Specialized layout for admin pages

**Props**:
```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
  sidebarItems: NavigationItem[];
  userRole?: string;
  className?: string;
}
```

**UI Elements**:
- Admin-specific header
- Admin navigation sidebar
- User role indicators
- Admin-specific footer
- System status indicators

**Features**:
- Role-based navigation
- Admin-specific styling
- System monitoring indicators
- Enhanced security considerations
- Audit trail awareness

### 4.10 AuthLayout

**Purpose**: Layout for authentication pages

**Props**:
```typescript
interface AuthLayoutProps {
  children: React.ReactNode;
  showLogo?: boolean;
  backgroundImage?: string;
  variant?: 'centered' | 'split' | 'full';
  className?: string;
}
```

**UI Elements**:
- Centered or split layout
- Logo and branding
- Authentication form container
- Background image or pattern
- Footer with help links

**Features**:
- Focused authentication experience
- Brand consistency
- Responsive design
- Security-focused layout
- Accessibility support

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface LayoutStore {
  // State
  sidebarCollapsed: boolean;
  isMobile: boolean;
  currentPath: string;
  navigationItems: NavigationItem[];
  breadcrumbs: BreadcrumbItem[];
  isDarkMode: boolean;
  isLoading: boolean;
  headerHeight: number;
  sidebarWidth: number;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPath: (path: string) => void;
  updateNavigationItems: (items: NavigationItem[]) => void;
  updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  toggleDarkMode: () => void;
  setDarkMode: (darkMode: boolean) => void;
  setLoading: (loading: boolean) => void;
  setHeaderHeight: (height: number) => void;
  setSidebarWidth: (width: number) => void;
  
  // Actions - Navigation
  navigateTo: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
  refresh: () => void;
  
  // Actions - Responsive
  handleResize: () => void;
  setMobileMode: (isMobile: boolean) => void;
  
  // Getters
  isSidebarVisible: boolean;
  isNavigationCollapsed: boolean;
  currentNavigationItem: NavigationItem | null;
  hasActiveNavigation: boolean;
}
```

### 5.2 Navigation State Management

- Route-based navigation tracking
- Breadcrumb auto-generation
- Active state management
- Navigation history tracking

## 6. UI/UX Requirements

### 6.1 Responsive Design

- Mobile-first approach
- Breakpoints: xs (0px), sm (600px), md (960px), lg (1280px), xl (1920px)
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

### 6.2 Navigation Patterns

- Consistent navigation patterns
- Clear visual hierarchy
- Intuitive menu structures
- Accessible navigation

### 6.3 Loading States

- Skeleton screens for layouts
- Loading indicators for async operations
- Progressive content loading
- Smooth transitions

### 6.4 Micro-interactions

- Smooth animations
- Hover states
- Focus indicators
- Transition effects

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Semantic HTML

- Proper use of semantic elements
- ARIA roles and landmarks
- Logical heading structure
- Skip navigation links

### 7.2 Keyboard Navigation

- Full keyboard accessibility
- Tab order management
- Focus management
- Shortcut keys

### 7.3 Screen Reader Support

- Navigation announcements
- Breadcrumb descriptions
- Menu item descriptions
- Context information

## 8. Responsive Behavior

### 8.1 Mobile Adaptation

- Hamburger menu for mobile
- Collapsible sidebar
- Touch-friendly targets
- Swipe gestures

### 8.2 Tablet Adaptation

- Adaptive navigation
- Flexible layouts
- Touch and mouse support
- Optimized spacing

### 8.3 Desktop Experience

- Full navigation visibility
- Hover interactions
- Keyboard shortcuts
- Multi-monitor support

## 9. Theme Support

### 9.1 Light/Dark Mode

- Theme switching capability
- System preference detection
- Persistent theme selection
- Smooth theme transitions

### 9.2 Customization Options

- Color scheme variations
- Component theming
- Brand customization
- Accessibility themes

## 10. Animation and Transitions

### 10.1 Layout Transitions

- Smooth sidebar collapse
- Page transition effects
- Loading animations
- State change animations

### 10.2 Performance Considerations

- Hardware acceleration
- Reduced motion support
- Optimized animations
- Battery considerations

## 11. Wireframes

### 11.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Smart AI Hub    [Dashboard] [Chat] [Profile] [Search] [🔔] [User▼] │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                                     │
│─────────├───────────────────────────────────────────────────────┤
│ 🏠 Home  │ Page Header                    [Action] [Action]    │
│ 💬 Chat  │ ────────────────────────────────────────────────   │
│ 👤 Profile│ Dashboard > Analytics > User Metrics                │
│ 💳 Billing│─────────────────────────────────────────────────   │
│ ⚙️ Settings│                                                     │
│         │ Page Content                                         │
│         │ ┌─────────────────────────────────────────────────┐   │
│         │ │                                                 │   │
│         │ │    Main page content goes here                  │   │
│         │ │                                                 │   │
│         │ └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ Footer with links and copyright information                    │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Mobile Layout

```
┌─────────────────────┐
│ ☰ Smart AI Hub [🔔] │
├─────────────────────┤
│ Page Header          │
│ Analytics > Metrics  │
├─────────────────────┤
│                     │
│ Page Content         │
│ ┌─────────────────┐ │
│ │                 │ │
│ │   Content       │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ [Action] [Action]   │
├─────────────────────┤
│ Bottom Navigation   │
│ [🏠] [💬] [👤] [⚙️] │
└─────────────────────┘
```

### 11.3 Admin Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin Hub   [Users] [System] [Reports] [⚠️] [Admin▼]          │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar │ Admin Content Area                                   │
│─────────├───────────────────────────────────────────────────────┤
│ 👥 Users │ User Management                                     │
│ 📊 Analytics│ ───────────────────────────────────────────────   │
│ 💰 Finance│ Search: [___________] [Filter▼] [Add User]         │
│ ⚙️ System│─────────────────────────────────────────────────   │
│ 📋 Logs  │                                                     │
│         │ User Table                                           │
│         │ ┌─────────────────────────────────────────────────┐   │
│         │ │ Name   Email    Role    Status    Actions       │   │
│         │ │ John   john@...  User    Active    [Edit] [Del] │   │
│         │ │ Jane   jane@...  Admin   Active    [Edit] [Del] │   │
│         │ └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ Admin Footer • System Status: Operational • Last backup: 2h ago │
└─────────────────────────────────────────────────────────────────┘
```

## 12. Implementation Checklist

- [ ] Create LayoutProvider with context
- [ ] Implement AppLayout component
- [ ] Implement AppHeader component
- [ ] Implement AppSidebar component
- [ ] Implement NavigationItem component
- [ ] Implement BreadcrumbNavigation component
- [ ] Implement PageHeader component
- [ ] Implement AppFooter component
- [ ] Implement AdminLayout component
- [ ] Implement AuthLayout component
- [ ] Create Zustand layout store
- [ ] Add responsive behavior
- [ ] Implement theme switching
- [ ] Add navigation state management
- [ ] Ensure accessibility compliance
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create Storybook stories
- [ ] Performance optimization
- [ ] Cross-browser testing

---

**หมายเหตุ:** เอกสารนี้เป็นส่วนหนึ่งของ Frontend Specifications และจะถูกอัปเดตตามความจำเป็น