---
title: "Billing and Payment Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P1 - High"
related_specs: ["FR-003-CreditManagement", "FR-CREDIT-03", "FR-CREDIT-04"]
---

# Billing and Payment Components

## 1. ภาพรวม (Overview)

Billing and Payment components provide comprehensive payment processing, subscription management, and billing functionality for the Smart AI Hub platform. These components handle credit purchases, subscription plans, payment methods, invoicing, and billing history.

## 2. วัตถุประสงค์ (Objectives)

- ให้การซื้อเครดิตและการสมัครสมาชิกที่ปลอดภัย
- รองรับวิธีการชำระเงินที่หลากหลาย
- จัดการวิธีการชำระเงินและการเรียกเก็บเงิน
- แสดงประวัติการเรียกเก็บเงินและใบแจ้งหนี้
- ให้การจัดการการสมัครสมาชิกแบบอัตโนมัติ

## 3. Component Hierarchy

```
BillingPayment
├── BillingOverview
│   ├── CurrentPlanCard
│   ├── UsageSummary
│   ├── NextBillingDate
│   └── QuickActions
├── PaymentMethods
│   ├── PaymentMethodList
│   ├── PaymentMethodItem
│   ├── AddPaymentMethod
│   └── DefaultPaymentSelector
├── SubscriptionPlans
│   ├── PlanComparison
│   ├── PlanCard
│   ├── PlanFeatures
│   └── PlanToggle
├── BillingHistory
│   ├── InvoiceList
│   ├── InvoiceItem
│   ├── InvoiceDetails
│   └── DownloadInvoice
├── CheckoutForm
│   ├── OrderSummary
│   ├── PaymentDetails
│   ├── BillingAddress
│   └── SubmitPayment
└── PaymentStatus
    ├── SuccessScreen
    ├── FailureScreen
    └── ProcessingScreen
```

## 4. Component Specifications

### 4.1 BillingOverview

**Purpose**: Dashboard-style overview of billing status and quick actions

**Props**:
```typescript
interface BillingOverviewProps {
  currentPlan: SubscriptionPlan;
  nextBillingDate: Date;
  currentUsage: UsageMetrics;
  paymentMethods: PaymentMethod[];
  onUpgradePlan?: () => void;
  onManagePayment?: () => void;
  onViewInvoices?: () => void;
}
```

**UI Elements**:
- Current subscription plan card
- Usage metrics with progress bars
- Next billing date countdown
- Quick action buttons
- Payment method status indicator

**Features**:
- Real-time usage tracking
- Plan upgrade suggestions
- Payment method expiration warnings
- Billing cycle visual indicators

### 4.2 PaymentMethods

**Purpose**: Manage saved payment methods and add new ones

**Props**:
```typescript
interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  defaultMethodId: string;
  onAddMethod: () => void;
  onSetDefault: (id: string) => void;
  onRemoveMethod: (id: string) => void;
  onUpdateMethod: (id: string, updates: Partial<PaymentMethod>) => void;
}
```

**UI Elements**:
- List of saved payment methods
- Add new payment method button
- Default payment method indicator
- Edit/remove options for each method
- Payment method type icons

**Supported Methods**:
- Credit/Debit Cards (Visa, Mastercard, Amex)
- Digital Wallets (PayPal, Apple Pay, Google Pay)
- Bank transfers (ACH, SEPA)
- Cryptocurrency (Bitcoin, Ethereum)

### 4.3 AddPaymentMethod

**Purpose**: Form to add a new payment method

**Props**:
```typescript
interface AddPaymentMethodProps {
  onSuccess: (method: PaymentMethod) => void;
  onCancel?: () => void;
  type?: PaymentMethodType;
  className?: string;
}
```

**UI Elements**:
- Payment method type selector
- Secure card input form (Stripe Elements)
- Billing address form
- Save as default checkbox
- Terms and conditions checkbox

**Security Features**:
- PCI DSS compliant card inputs
- Tokenization of sensitive data
- 3D Secure authentication
- Address verification system (AVS)

### 4.4 SubscriptionPlans

**Purpose**: Display available subscription plans and handle plan changes

**Props**:
```typescript
interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentPlanId: string;
  onPlanChange: (planId: string) => Promise<void>;
  onAnnualToggle?: (isAnnual: boolean) => void;
  showComparison?: boolean;
}
```

**UI Elements**:
- Plan comparison table
- Individual plan cards
- Monthly/annual toggle
- Feature lists with checkmarks
- Popular/best value badges
- Upgrade/downgrade buttons

**Plan Types**:
- Free tier (limited credits)
- Pro tier (pay-as-you-go)
- Business tier (monthly credits)
- Enterprise tier (custom pricing)

### 4.5 PlanCard

**Purpose**: Individual subscription plan display

**Props**:
```typescript
interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrent?: boolean;
  isPopular?: boolean;
  onSelect?: () => void;
  currency?: string;
  billingCycle?: 'monthly' | 'annual';
}
```

**UI Elements**:
- Plan name and badge
- Pricing display with currency
- Feature list
- Select/upgrade button
- Current plan indicator
- Savings indicator for annual plans

### 4.6 BillingHistory

**Purpose**: Display historical billing information and invoices

**Props**:
```typescript
interface BillingHistoryProps {
  invoices: Invoice[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onDownloadInvoice?: (id: string) => void;
  onRetryPayment?: (id: string) => void;
}
```

**UI Elements**:
- Invoice list with filters
- Invoice items with status indicators
- Download buttons for PDF invoices
- Retry payment options for failed payments
- Date range selector
- Export functionality

**Invoice States**:
- Paid (green)
- Pending (yellow)
- Failed (red)
- Refunded (gray)

### 4.7 InvoiceItem

**Purpose**: Individual invoice display with details

**Props**:
```typescript
interface InvoiceItemProps {
  invoice: Invoice;
  onDownload?: () => void;
  onViewDetails?: () => void;
  onRetryPayment?: () => void;
  compact?: boolean;
}
```

**UI Elements**:
- Invoice number and date
- Amount with currency
- Status indicator
- Download button
- View details button
- Retry payment button (if failed)

### 4.8 CheckoutForm

**Purpose**: Multi-step checkout process for payments

**Props**:
```typescript
interface CheckoutFormProps {
  items: CheckoutItem[];
  totalAmount: number;
  currency: string;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: PaymentError) => void;
  onBack?: () => void;
}
```

**Steps**:
1. Order Summary
2. Payment Method Selection
3. Billing Information
4. Review & Confirm
5. Payment Processing

**UI Elements**:
- Progress indicator
- Order summary with itemization
- Payment method selection
- Secure payment form
- Billing address form
- Review and confirmation screen

### 4.9 PaymentStatus

**Purpose**: Display payment result after checkout

**Props**:
```typescript
interface PaymentStatusProps {
  status: 'success' | 'failure' | 'processing';
  transactionId?: string;
  amount?: number;
  currency?: string;
  onContinue?: () => void;
  onRetry?: () => void;
  onViewInvoice?: () => void;
}
```

**Status Screens**:
- Success: Confirmation with transaction details
- Failure: Error message with retry option
- Processing: Loading state with timeout

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface BillingStore {
  // State
  currentPlan: SubscriptionPlan | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  checkoutItems: CheckoutItem[];
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  fetchBillingInfo: () => Promise<void>;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: PaymentMethodData) => Promise<PaymentMethod>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  changeSubscription: (planId: string) => Promise<void>;
  fetchInvoices: () => Promise<void>;
  downloadInvoice: (id: string) => Promise<Blob>;
  processPayment: (data: PaymentData) => Promise<PaymentResult>;
  
  // Getters
  hasPaymentMethod: boolean;
  nextBillingDate: Date | null;
  monthlySpend: number;
  isSubscriptionActive: boolean;
}
```

## 6. Payment Integration

### 6.1 Stripe Integration

- Stripe Elements for secure card inputs
- Payment Intents API for payment processing
- Stripe Connect for marketplace functionality
- Radar for fraud detection

### 6.2 Digital Wallets

- Apple Pay integration
- Google Pay integration
- PayPal Express Checkout
- Amazon Pay (future)

### 6.3 Security Measures

- PCI DSS compliance
- 3D Secure 2.0 authentication
- Tokenization of payment data
- End-to-end encryption

## 7. UI/UX Requirements

### 7.1 Responsive Design

- **Desktop**: Multi-column layout with detailed information
- **Tablet**: Two-column layout with compact cards
- **Mobile**: Single column with stacked sections

### 7.2 Loading States

- Skeleton screens for data loading
- Shimmer effects for payment processing
- Progress indicators for multi-step forms
- Loading states for API calls

### 7.3 Error Handling

- Clear error messages for payment failures
- Retry mechanisms for failed operations
- Graceful degradation for network issues
- User guidance for resolution

## 8. Accessibility (WCAG 2.1 Level AA)

### 8.1 Semantic Structure

- Proper heading hierarchy
- Landmark regions
- Semantic HTML5 elements
- ARIA labels and descriptions

### 8.2 Keyboard Navigation

- Tab order follows visual layout
- Focus indicators on all interactive elements
- Keyboard shortcuts for common actions
- Skip navigation links

### 8.3 Screen Reader Support

- Announcements for dynamic content
- Alternative text for icons and images
- Table headers for data tables
- Descriptive link text

## 9. Testing Requirements

### 9.1 Unit Tests

- Component rendering
- State management
- Form validation
- Utility functions

### 9.2 Integration Tests

- Payment flows
- Stripe integration
- Form submissions
- Error scenarios

### 9.3 E2E Tests

- Complete checkout flow
- Payment method management
- Subscription changes
- Invoice downloads

## 10. Wireframes

### 10.1 Billing Overview (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│ Billing & Payments                                     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│ │ Current Plan    │ │ Usage This Month│ │ Quick Actions│ │
│ │ Pro Plan        │ │ ████████░░ 80%  │ │ [Upgrade]   │ │
│ │ $49/month       │ │ 800/1000 credits│ │ [Add Card]  │ │
│ │ Renews Dec 15   │ │                 │ │ [Invoices]  │ │
│ │ [Manage]        │ │ [View Details]  │ │             │ │
│ └─────────────────┘ └─────────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Payment Methods                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ● Visa ****4242 (Expires 12/25) - Default          │ │
│ │ ○ PayPal user@example.com                          │ │
│ │ [Add New Payment Method]                            │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Recent Invoices                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ #INV-2024-001 - Nov 15, 2024 - $49.00 [Download]   │ │
│ │ #INV-2024-002 - Oct 15, 2024 - $49.00 [Download]   │ │
│ │ [View All Invoices]                                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Checkout Flow (Mobile)

```
┌─────────────────┐
│ Checkout         │
│ ●●●○○ Steps 3/5 │
├─────────────────┤
│ Payment Method   │
│                 │
│ ● Visa ****4242  │
│   Default        │
│                 │
│ ○ Add New Card   │
│                 │
│ ┌─────────────┐ │
│ │ Card Number │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ MM/YY       │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ CVC         │ │
│ └─────────────┘ │
│                 │
│ ☑ Save as default│
│                 │
│ [Back] [Continue]│
└─────────────────┘
```

## 11. Implementation Checklist

- [ ] Create BillingOverview component
- [ ] Implement PaymentMethods management
- [ ] Create AddPaymentMethod form
- [ ] Implement SubscriptionPlans display
- [ ] Create BillingHistory component
- [ ] Implement CheckoutForm flow
- [ ] Create PaymentStatus screens
- [ ] Set up Zustand billing store
- [ ] Integrate Stripe payment processing
- [ ] Add digital wallet support
- [ ] Ensure responsive design
- [ ] Add accessibility features
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create Storybook stories
- [ ] Security review
- [ ] Error handling implementation

---

**หมายเหตุ:** เอกสารนี้เป็นส่วนหนึ่งของ Frontend Specifications และจะถูกอัปเดตตามความจำเป็น