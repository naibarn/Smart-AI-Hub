---
title: "User Profile Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["FR-001-User-Management", "FR-002-Profile-Settings"]
---

# User Profile Components

## 1. ภาพรวม (Overview)

User Profile components provide comprehensive user profile management functionality for the Smart AI Hub platform. These components handle profile viewing, editing, account settings, and user preferences management.

## 2. วัตถุประสงค์ (Objectives)

- ให้ผู้ใช้สามารถดูและแก้ไขข้อมูลส่วนตัวได้
- จัดการการตั้งค่าบัญชีผู้ใช้
- ควบคุมความเป็นส่วนตัวและการแจ้งเตือน
- จัดการวิธีการชำระเงินและประวัติการทำธุรกรรม
- ให้ประสบการณ์ผู้ใช้ที่สม่ำเสมอและเป็นมิตร

## 3. Component Hierarchy

```
UserProfileProvider
├── ProfilePage
│   ├── ProfileHeader
│   │   ├── AvatarUpload
│   │   ├── UserBadge
│   │   └── ProfileActions
│   ├── ProfileTabs
│   │   ├── TabNavigation
│   │   ├── TabPanel
│   │   └── TabContent
│   ├── PersonalInfoTab
│   │   ├── PersonalInfoForm
│   │   ├── EmailVerification
│   │   └── PasswordChangeForm
│   ├── AccountSettingsTab
│   │   ├── AccountSettingsForm
│   │   ├── TwoFactorAuth
│   │   ├── SessionManagement
│   │   └── DeleteAccountSection
│   ├── NotificationSettingsTab
│   │   ├── NotificationPreferences
│   │   ├── EmailNotifications
│   │   └── PushNotifications
│   ├── PaymentMethodsTab
│   │   ├── PaymentMethodsList
│   │   ├── AddPaymentMethod
│   │   └── BillingHistory
│   └── UsageAnalyticsTab
│       ├── UsageCharts
│       ├── UsageStatistics
│       └── ExportDataButton
└── ProfileModals
    ├── AvatarCropModal
    ├── EmailVerificationModal
    ├── DeleteAccountModal
    └── TwoFactorSetupModal
```

## 4. Component Specifications

### 4.1 UserProfileProvider

**Purpose**: Provides profile context and state management

**Props**: None

**State**:
```typescript
interface ProfileState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  activeTab: string;
  hasUnsavedChanges: boolean;
}

interface ProfileContextValue extends ProfileState {
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  addPaymentMethod: (method: PaymentMethod) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
  setActiveTab: (tab: string) => void;
  resetChanges: () => void;
}
```

**Features**:
- Profile data caching and synchronization
- Optimistic updates for better UX
- Automatic save detection
- Change tracking with warnings

### 4.2 ProfilePage

**Purpose**: Main profile page container

**Props**:
```typescript
interface ProfilePageProps {
  userId?: string;
  defaultTab?: string;
  editable?: boolean;
  className?: string;
}
```

**UI Elements**:
- Profile header with avatar and basic info
- Tab navigation for different profile sections
- Content area with active tab panel
- Breadcrumb navigation
- Save/discard changes banner (when unsaved changes)

**Features**:
- Responsive layout
- Tab persistence across navigation
- Unsaved changes detection
- Auto-save functionality

### 4.3 ProfileHeader

**Purpose**: Displays user profile summary and quick actions

**Props**:
```typescript
interface ProfileHeaderProps {
  user: User;
  profile: UserProfile;
  isEditable?: boolean;
  onUpdate?: (data: Partial<UserProfile>) => void;
  className?: string;
}
```

**UI Elements**:
- User avatar with upload functionality
- User name and email display
- Account status badge
- Join date and last active
- Quick action buttons

**Features**:
- Avatar upload with crop functionality
- Real-time preview
- Profile completion percentage
- Account verification status

### 4.4 PersonalInfoForm

**Purpose**: Handles personal information editing

**Props**:
```typescript
interface PersonalInfoFormProps {
  initialData: PersonalInfo;
  onSubmit: (data: PersonalInfo) => Promise<void>;
  isEmailVerified?: boolean;
  className?: string;
}
```

**UI Elements**:
- First name and last name inputs
- Email display with verification status
- Phone number input with country code
- Bio/description textarea
- Timezone selector
- Language preference selector

**Validation Rules**:
- First/Last Name: Required, max 50 characters
- Email: Read-only (changed via separate flow)
- Phone: Optional, valid format
- Bio: Optional, max 500 characters

### 4.5 PasswordChangeForm

**Purpose**: Handles password change functionality

**Props**:
```typescript
interface PasswordChangeFormProps {
  onSubmit: (data: PasswordChangeData) => Promise<void>;
  requiresCurrentPassword?: boolean;
  className?: string;
}
```

**UI Elements**:
- Current password input (if required)
- New password input with strength indicator
- Confirm new password input
- Password requirements checklist
- Submit button with loading state

**Security Features**:
- Password strength validation
- Current password verification
- Rate limiting
- Secure transmission

### 4.6 TwoFactorAuth

**Purpose**: Manages two-factor authentication settings

**Props**:
```typescript
interface TwoFactorAuthProps {
  isEnabled: boolean;
  onEnable: () => Promise<void>;
  onDisable: (code: string) => Promise<void>;
  className?: string;
}
```

**UI Elements**:
- Status indicator
- Enable/disable toggle
- QR code display (for setup)
- Backup codes display
- Recovery options

**Features**:
- TOTP support
- Backup code generation
- Recovery options
- Security recommendations

### 4.7 NotificationPreferences

**Purpose**: Manages user notification preferences

**Props**:
```typescript
interface NotificationPreferencesProps {
  preferences: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => Promise<void>;
  className?: string;
}
```

**UI Elements**:
- Email notification toggles
- Push notification toggles
- Notification frequency settings
- Notification categories
- Quiet hours configuration

**Categories**:
- Account security
- Billing and payments
- Usage alerts
- Feature updates
- Marketing communications

### 4.8 PaymentMethodsList

**Purpose**: Displays and manages payment methods

**Props**:
```typescript
interface PaymentMethodsListProps {
  paymentMethods: PaymentMethod[];
  onAdd: () => void;
  onRemove: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  className?: string;
}
```

**UI Elements**:
- Payment method cards (credit cards, etc.)
- Add new payment method button
- Set as default option
- Remove payment method option
- Expiry date indicators

**Security Features**:
- Masked card numbers
- Secure tokenization
- PCI DSS compliance

### 4.9 UsageAnalytics

**Purpose**: Displays usage statistics and analytics

**Props**:
```typescript
interface UsageAnalyticsProps {
  usageData: UsageData;
  timeframe: 'week' | 'month' | 'year';
  onTimeframeChange: (timeframe: string) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  className?: string;
}
```

**UI Elements**:
- Usage charts (credits, API calls, etc.)
- Time period selector
- Detailed statistics table
- Export functionality
- Usage predictions

**Features**:
- Interactive charts
- Real-time data
- Historical comparisons
- Usage insights

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface ProfileStore {
  // State
  user: User | null;
  profile: UserProfile | null;
  paymentMethods: PaymentMethod[];
  notificationSettings: NotificationSettings;
  usageData: UsageData | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  activeTab: string;
  unsavedChanges: Record<string, any>;
  
  // Actions
  fetchProfile: (userId?: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  addPaymentMethod: (method: PaymentMethod) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  fetchUsageData: (timeframe: string) => Promise<void>;
  setActiveTab: (tab: string) => void;
  trackChanges: (section: string, data: any) => void;
  discardChanges: () => void;
  saveChanges: () => Promise<void>;
  clearError: () => void;
  
  // Getters
  hasUnsavedChanges: boolean;
  isEmailVerified: boolean;
  profileCompletion: number;
  activePaymentMethod: PaymentMethod | null;
}
```

### 5.2 Data Synchronization

- Real-time updates via WebSocket
- Optimistic updates with rollback
- Conflict resolution strategies
- Offline detection and handling

## 6. UI/UX Requirements

### 6.1 Responsive Design

- Mobile-first approach
- Breakpoints: xs (0px), sm (600px), md (960px), lg (1280px), xl (1920px)
- Adaptive layouts for different screen sizes
- Touch-friendly interactions

### 6.2 Loading States

- Skeleton screens for forms
- Progress indicators for uploads
- Loading states for async operations
- Smooth transitions between states

### 6.3 Error Handling

- Inline validation errors
- Toast notifications for API errors
- Form-level error summaries
- Network error recovery

### 6.4 Micro-interactions

- Smooth tab transitions
- Hover states on interactive elements
- Focus indicators
- Subtle animations for state changes

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Semantic HTML

- Proper use of form elements
- ARIA labels and descriptions
- Logical heading structure
- Landmark regions

### 7.2 Keyboard Navigation

- Full keyboard accessibility
- Tab order management
- Focus trapping in modals
- Skip navigation links

### 7.3 Screen Reader Support

- Form labels and descriptions
- Error announcements
- Status updates
- Alternative text for images

## 8. Form Validation

### 8.1 Client-side Validation

- Real-time validation
- Debounced validation
- Cross-field validation
- Custom validation rules

### 8.2 Validation Schema (Zod)

```typescript
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  phone: z.string().optional().refine(val => !val || isValidPhone(val), "Invalid phone number"),
  bio: z.string().max(500, "Bio too long").optional(),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[0-9]/, "Password must contain number")
    .regex(/[^A-Za-z0-9]/, "Password must contain special character"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## 9. API Integration

### 9.1 Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar
- `PUT /api/users/password` - Change password
- `POST /api/users/2fa/enable` - Enable 2FA
- `POST /api/users/2fa/disable` - Disable 2FA
- `GET /api/users/notifications` - Get notification settings
- `PUT /api/users/notifications` - Update notification settings
- `GET /api/users/payment-methods` - Get payment methods
- `POST /api/users/payment-methods` - Add payment method
- `DELETE /api/users/payment-methods/:id` - Remove payment method
- `GET /api/users/usage` - Get usage statistics
- `DELETE /api/users/account` - Delete account

### 9.2 Error Handling

- Validation error display
- Network error handling
- Rate limiting handling
- Permission error handling

## 10. Testing Requirements

### 10.1 Unit Tests

- Form validation logic
- State management actions
- Utility functions
- Component rendering

### 10.2 Integration Tests

- Profile update flows
- Password change flow
- Payment method management
- Notification settings

### 10.3 E2E Tests

- Complete profile editing flow
- Avatar upload flow
- 2FA setup flow
- Account deletion flow

## 11. Performance Considerations

### 11.1 Bundle Optimization

- Code splitting for profile sections
- Lazy loading of charts
- Image optimization
- Tree shaking

### 11.2 Runtime Performance

- Memoized expensive operations
- Debounced form validation
- Optimized re-renders
- Efficient data fetching

## 12. Security Considerations

### 12.1 Data Protection

- Secure data transmission
- Sensitive data masking
- Rate limiting
- Input sanitization

### 12.2 Payment Security

- PCI DSS compliance
- Tokenization
- Secure storage
- Audit logging

## 13. Wireframes

### 13.1 Profile Page (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│ Profile                                    [Save] [Discard] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ John Doe                          [Edit Avatar] │
│ │ Avatar  │ john.doe@example.com              Verified     │
│ └─────────┘ Member since Oct 2023             Last active │
├─────────────────────────────────────────────────────────┤
│ [Personal] [Account] [Notifications] [Payment] [Usage]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Personal Information                                   │
│  ┌─────────────────────┐ ┌─────────────────────┐       │
│  │ First Name          │ │ Last Name           │       │
│  └─────────────────────┘ └─────────────────────┘       │
│                                                         │
│  ┌─────────────────────┐                               │
│  │ Email Address       │ [Verified] [Resend]            │
│  └─────────────────────┘                               │
│                                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐       │
│  │ Phone Number        │ │ Timezone            │       │
│  └─────────────────────┘ └─────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Bio                                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 13.2 Mobile Layout

```
┌─────────────────────┐
│ Profile      [Save] │
├─────────────────────┤
│ ┌───┐ John Doe      │
│ │Avatar│ john@...   │
│ └───┐ Verified      │
├─────────────────────┤
│ [Personal][Account] │
├─────────────────────┤
│ Personal Info       │
│ ┌─────────────────┐ │
│ │ First Name      │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Last Name       │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ Email           │ │
│ └─────────────────┘ │
│     [Verified]     │
└─────────────────────┘
```

## 14. Implementation Checklist

- [ ] Create UserProfileProvider with context
- [ ] Implement ProfilePage component
- [ ] Implement ProfileHeader component
- [ ] Implement PersonalInfoForm component
- [ ] Implement PasswordChangeForm component
- [ ] Implement TwoFactorAuth component
- [ ] Implement NotificationPreferences component
- [ ] Implement PaymentMethodsList component
- [ ] Implement UsageAnalytics component
- [ ] Create Zustand profile store
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