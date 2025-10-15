---
title: "Authentication Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P0 - Critical"
related_specs: ["FR-001-Registration", "FR-AUTH-05", "FR-AUTH-06"]
---

# Authentication Components

## 1. ภาพรวม (Overview)

Authentication components provide secure user authentication flows for the Smart AI Hub platform. These components handle user registration, login, password reset, and OAuth integration with Google.

## 2. วัตถุประสงค์ (Objectives)

- ให้ผู้ใช้สามารถลงทะเบียนและล็อกอินเข้าสู่ระบบได้อย่างปลอดภัย
- รองรับการล็อกอินหลายช่องทาง (Email/Password และ Google OAuth)
- จัดการการรีเซ็ตรหัสผ่านอย่างปลอดภัย
- ให้ประสบการณ์ผู้ใช้ที่สม่ำเสมอและเป็นมิตร

## 3. Component Hierarchy

```
AuthProvider
├── LoginForm
│   ├── EmailField
│   ├── PasswordField
│   ├── RememberMeCheckbox
│   ├── SubmitButton
│   ├── ForgotPasswordLink
│   └── GoogleLoginButton
├── RegisterForm
│   ├── EmailField
│   ├── PasswordField
│   ├── ConfirmPasswordField
│   ├── TermsCheckbox
│   └── SubmitButton
├── PasswordResetForm
│   ├── EmailField
│   └── SubmitButton
├── PasswordResetConfirmForm
│   ├── NewPasswordField
│   ├── ConfirmNewPasswordField
│   └── SubmitButton
└── OAuthCallback
    ├── LoadingSpinner
    └── SuccessMessage
```

## 4. Component Specifications

### 4.1 AuthProvider

**Purpose**: Provides authentication context and state management

**Props**: None

**State**:
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (token: string, password: string) => Promise<void>;
  clearError: () => void;
}
```

**Features**:
- JWT token management with automatic refresh
- Session persistence in localStorage
- Automatic logout on token expiration
- Global error handling for auth operations

### 4.2 LoginForm

**Purpose**: Handles user login with email/password and Google OAuth

**Props**:
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showGoogleLogin?: boolean;
  className?: string;
}
```

**UI Elements**:
- Email input field with validation
- Password input field with show/hide toggle
- "Remember me" checkbox
- Login button with loading state
- "Forgot password?" link
- Google OAuth login button
- Registration link for new users

**Validation Rules**:
- Email: Required, valid email format
- Password: Required, min 8 characters

**Accessibility**:
- All form elements properly labeled
- Keyboard navigation support
- Screen reader announcements for errors
- Focus management on form submission

### 4.3 RegisterForm

**Purpose**: Handles new user registration

**Props**:
```typescript
interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  requireTerms?: boolean;
  className?: string;
}
```

**UI Elements**:
- Email input field with real-time validation
- Password input field with strength indicator
- Confirm password input field
- Terms and conditions checkbox
- Registration button with loading state
- Login link for existing users

**Validation Rules**:
- Email: Required, valid email format, unique
- Password: Required, min 8 characters, uppercase, number, special char
- Confirm Password: Required, must match password
- Terms: Required (if enabled)

**Password Strength Indicator**:
- Visual indicator showing password strength
- Real-time feedback with color coding
- Requirements checklist

### 4.4 PasswordResetForm

**Purpose**: Initiates password reset process

**Props**:
```typescript
interface PasswordResetFormProps {
  onSuccess?: (email: string) => void;
  className?: string;
}
```

**UI Elements**:
- Email input field
- Submit button with loading state
- Back to login link
- Success message with instructions

### 4.5 PasswordResetConfirmForm

**Purpose**: Completes password reset with new password

**Props**:
```typescript
interface PasswordResetConfirmFormProps {
  token: string;
  onSuccess?: () => void;
  className?: string;
}
```

**UI Elements**:
- New password input field
- Confirm new password input field
- Submit button with loading state
- Password strength indicator

### 4.6 GoogleLoginButton

**Purpose**: Handles Google OAuth authentication

**Props**:
```typescript
interface GoogleLoginButtonProps {
  onSuccess?: (user: User) => void;
  onError?: (error: Error) => void;
  className?: string;
}
```

**UI Elements**:
- Google branded button
- Loading state during OAuth flow
- Error display for OAuth failures

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (data: ConfirmResetData) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  
  // Getters
  isAuthenticated: boolean;
  isAdmin: boolean;
}
```

### 5.2 Persistence Strategy

- Tokens stored in httpOnly cookies (production) or localStorage (development)
- User session persisted across page refreshes
- Automatic token refresh before expiration
- Secure logout with token invalidation

## 6. UI/UX Requirements

### 6.1 Responsive Design

- Mobile-first approach
- Breakpoints: xs (0px), sm (600px), md (960px), lg (1280px), xl (1920px)
- Touch-friendly tap targets (minimum 44px)
- Optimized keyboard input on mobile devices

### 6.2 Loading States

- Skeleton screens for form inputs
- Loading spinners with proper ARIA labels
- Progress indicators for multi-step processes
- Disabled state for all interactive elements during loading

### 6.3 Error Handling

- Inline validation with clear error messages
- Toast notifications for API errors
- Form-level error summaries
- Graceful degradation for network failures

### 6.4 Micro-interactions

- Smooth transitions between states
- Hover states on interactive elements
- Focus indicators for keyboard navigation
- Subtle animations for form validation

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Semantic HTML

- Proper use of `<form>`, `<label>`, `<input>` elements
- ARIA labels and descriptions where needed
- Logical heading structure
- Skip navigation links

### 7.2 Keyboard Navigation

- Tab order follows visual layout
- All interactive elements reachable via keyboard
- Enter/Space key activation for buttons
- Escape key closes modals/clears forms

### 7.3 Screen Reader Support

- Form fields properly labeled
- Error messages announced
- Live regions for dynamic content
- Alternative text for icons and images

## 8. Form Validation

### 8.1 Client-side Validation

- Real-time validation on input change
- Validation on blur event
- Comprehensive validation before submission
- Clear error messages with guidance

### 8.2 Validation Schema (Zod)

```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## 9. API Integration

### 9.1 Endpoints

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - User registration
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/confirm-reset` - Confirm password reset
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### 9.2 Error Handling

- Network error handling with retry logic
- Unauthorized response handling
- Rate limiting error display
- Graceful degradation for API failures

## 10. Testing Requirements

### 10.1 Unit Tests

- Form validation logic
- State management actions
- Utility functions
- Component rendering

### 10.2 Integration Tests

- Form submission flows
- OAuth integration
- Token management
- Error scenarios

### 10.3 E2E Tests

- Complete login flow
- Registration flow
- Password reset flow
- OAuth authentication

## 11. Performance Considerations

### 11.1 Bundle Optimization

- Code splitting for auth components
- Lazy loading of OAuth libraries
- Tree shaking for unused dependencies
- Minimal impact on initial load

### 11.2 Runtime Performance

- Debounced validation
- Optimized re-renders
- Memoized expensive operations
- Efficient state updates

## 12. Security Considerations

### 12.1 Token Security

- Secure token storage
- Automatic token refresh
- Token expiration handling
- CSRF protection

### 12.2 Input Sanitization

- XSS prevention
- Input validation on server-side
- Secure password handling
- Rate limiting implementation

## 13. Wireframes

### 13.1 Login Form (Desktop)

```
┌─────────────────────────────────┐
│              Logo               │
├─────────────────────────────────┤
│                                 │
│    ┌─────────────────────┐      │
│    │   Email Address     │      │
│    └─────────────────────┘      │
│                                 │
│    ┌─────────────────────┐      │
│    │     Password        │      │
│    └─────────────────────┘      │
│                                 │
│    ☑ Remember me    Forgot?    │
│                                 │
│    ┌─────────────────────┐      │
│    │      Login          │      │
│    └─────────────────────┘      │
│                                 │
│    ┌─────────────────────┐      │
│    │   Login with Google │      │
│    └─────────────────────┘      │
│                                 │
│        Don't have account?      │
│           Sign up               │
└─────────────────────────────────┘
```

### 13.2 Mobile Layout

```
┌─────────────────┐
│      Logo       │
├─────────────────┤
│                 │
│ ┌─────────────┐ │
│ │    Email    │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │  Password   │ │
│ └─────────────┘ │
│                 │
│ ☑ Remember     │
│ Forgot?         │
│                 │
│ ┌─────────────┐ │
│ │   Login     │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │Google Login │ │
│ └─────────────┘ │
│                 │
│  New? Sign up   │
└─────────────────┘
```

## 14. Implementation Checklist

- [ ] Create AuthProvider with context
- [ ] Implement LoginForm component
- [ ] Implement RegisterForm component
- [ ] Implement PasswordResetForm component
- [ ] Implement GoogleLoginButton component
- [ ] Create Zustand auth store
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