---
title: "Credit Management Components"
author: "Frontend Team"
created_date: "2025-10-14"
last_updated: "2025-10-14"
version: "1.0"
status: "Draft"
priority: "P0 - Critical"
related_specs: ["FR-003-CreditManagement", "FR-CREDIT-03", "FR-CREDIT-04"]
---

# Credit Management Components

## 1. ภาพรวม (Overview)

Credit Management components provide comprehensive credit tracking, purchasing, and management functionality for the Smart AI Hub platform. These components enable users to monitor their credit balance, view transaction history, purchase credits, and manage promotional codes.

## 2. วัตถุประสงค์ (Objectives)

- ให้ผู้ใช้สามารถตรวจสอบยอดเครดิตคงเหลือได้ตลอดเวลา
- ให้การซื้อเครดิตที่ปลอดภัยและสะดวก
- แสดงประวัติการทำรายการทั้งหมดอย่างชัดเจน
- รองรับการใช้โปรโมชั่นโค้ด
- ให้ข้อมูลเชิงลึกเกี่ยวกับการใช้เครดิต

## 3. Component Hierarchy

```
CreditManagement
├── CreditBalanceCard
│   ├── BalanceDisplay
│   ├── LastUpdated
│   ├── LowBalanceWarning
│   └── QuickActions
├── CreditPurchaseForm
│   ├── PackageSelector
│   ├── PaymentMethodSelector
│   ├── PromoCodeInput
│   ├── PriceSummary
│   └── PurchaseButton
├── TransactionHistory
│   ├── FilterBar
│   ├── TransactionList
│   ├── TransactionItem
│   ├── Pagination
│   └── ExportButton
├── UsageAnalytics
│   ├── UsageChart
│   ├── DateRangeSelector
│   ├── ServiceBreakdown
│   └── UsageInsights
└── PromoCodeSection
    ├── PromoCodeInput
    ├── ApplyButton
    ├── SuccessMessage
    └── ErrorMessage
```

## 4. Component Specifications

### 4.1 CreditBalanceCard

**Purpose**: Display current credit balance with quick actions

**Props**:
```typescript
interface CreditBalanceCardProps {
  balance: number;
  lastUpdated: Date;
  currency?: string;
  showLowBalanceWarning?: boolean;
  onTopUp?: () => void;
  onViewHistory?: () => void;
  className?: string;
}
```

**UI Elements**:
- Large balance display with currency formatting
- Last updated timestamp with relative time
- Low balance warning banner (threshold: 20% of average usage)
- Quick action buttons (Top Up, View History)
- Balance trend indicator (up/down/same)

**Features**:
- Real-time balance updates via WebSocket
- Animated number transitions
- Currency conversion display
- Balance projection based on usage trends

### 4.2 CreditPurchaseForm

**Purpose**: Handle credit purchase process with multiple payment options

**Props**:
```typescript
interface CreditPurchaseFormProps {
  packages: CreditPackage[];
  paymentMethods: PaymentMethod[];
  onPurchaseSuccess?: (transaction: Transaction) => void;
  onPurchaseError?: (error: Error) => void;
  className?: string;
}
```

**UI Elements**:
- Package selection grid/cards
- Payment method selector (Credit Card, PayPal, etc.)
- Promo code input with validation
- Price summary with taxes and fees
- Secure purchase button with loading state

**Package Selection**:
- Visual package cards with credit amounts
- Popular/best value badges
- Bonus credit indicators
- Price per credit comparison

**Payment Integration**:
- Stripe Elements for secure card input
- PayPal Express Checkout
- Apple Pay/Google Pay (when available)
- Multi-currency support

### 4.3 TransactionHistory

**Purpose**: Display comprehensive transaction history with filtering

**Props**:
```typescript
interface TransactionHistoryProps {
  transactions: Transaction[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onExport?: (format: 'csv' | 'pdf') => void;
  className?: string;
}
```

**UI Elements**:
- Filter bar (date range, transaction type, amount)
- Sortable transaction list
- Transaction item with details
- Pagination or infinite scroll
- Export functionality

**Transaction Types**:
- Credit purchases
- Credit usage
- Promo code redemptions
- Refunds
- Adjustments

**Filtering Options**:
- Date range picker
- Transaction type checkboxes
- Amount range slider
- Search by description

### 4.4 UsageAnalytics

**Purpose**: Visualize credit usage patterns and insights

**Props**:
```typescript
interface UsageAnalyticsProps {
  usageData: UsageData[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  services: Service[];
  className?: string;
}
```

**UI Elements**:
- Interactive usage chart (line/bar)
- Date range selector
- Service usage breakdown
- Key insights and recommendations
- Comparison with previous periods

**Charts**:
- Daily/weekly/monthly usage trends
- Service usage distribution
- Cost per service analysis
- Usage velocity metrics

### 4.5 PromoCodeSection

**Purpose**: Handle promotional code redemption

**Props**:
```typescript
interface PromoCodeSectionProps {
  onApplyPromo: (code: string) => Promise<PromoResult>;
  onRemovePromo?: () => void;
  appliedPromo?: PromoCode;
  className?: string;
}
```

**UI Elements**:
- Promo code input field
- Apply/Remove button
- Success/error message display
- Applied promo details
- Terms and conditions link

**Validation**:
- Real-time code validation
- Expiration date checking
- Usage limit verification
- Eligibility validation

## 5. State Management

### 5.1 Zustand Store Structure

```typescript
interface CreditStore {
  // State
  balance: number;
  transactions: Transaction[];
  packages: CreditPackage[];
  usageData: UsageData[];
  appliedPromo: PromoCode | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchBalance: () => Promise<void>;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchPackages: () => Promise<void>;
  purchaseCredits: (packageId: string, paymentData: PaymentData) => Promise<Transaction>;
  applyPromoCode: (code: string) => Promise<PromoCode>;
  removePromoCode: () => void;
  fetchUsageData: (dateRange: DateRange) => Promise<void>;
  
  // Getters
  formattedBalance: string;
  lowBalanceWarning: boolean;
  recentTransactions: Transaction[];
  totalUsage: number;
}
```

### 5.2 Real-time Updates

- WebSocket connection for balance updates
- Live transaction updates
- Real-time usage tracking
- Push notifications for important events

## 6. UI/UX Requirements

### 6.1 Responsive Design

- **Desktop**: Multi-column layout with full analytics
- **Tablet**: Two-column layout with compact charts
- **Mobile**: Single column with swipeable sections

### 6.2 Loading States

- Skeleton screens for data cards
- Shimmer effects for transaction lists
- Loading states for payment processing
- Progressive content loading

### 6.3 Error Handling

- User-friendly error messages
- Retry mechanisms for failed operations
- Graceful degradation for payment failures
- Clear guidance for resolution

### 6.4 Micro-interactions

- Smooth animations for balance updates
- Hover effects on interactive elements
- Loading spinners for async operations
- Success animations for completed purchases

## 7. Accessibility (WCAG 2.1 Level AA)

### 7.1 Semantic Structure

- Proper heading hierarchy
- Landmark regions
- Semantic HTML5 elements
- ARIA labels and descriptions

### 7.2 Keyboard Navigation

- Tab order follows visual layout
- Focus indicators on all interactive elements
- Keyboard shortcuts for common actions
- Skip navigation links

### 7.3 Screen Reader Support

- Announcements for dynamic content
- Alternative text for charts
- Table headers for transaction lists
- Descriptive link text

## 8. Payment Integration

### 8.1 Security Requirements

- PCI DSS compliance
- Secure card data handling
- Tokenization of payment methods
- 3D Secure authentication

### 8.2 Supported Payment Methods

- Credit/Debit Cards (Visa, Mastercard, Amex)
- Digital Wallets (PayPal, Apple Pay, Google Pay)
- Bank transfers (for enterprise customers)
- Cryptocurrency (future enhancement)

### 8.3 Payment Flow

1. Select credit package
2. Choose payment method
3. Enter payment details
4. Apply promo code (optional)
5. Review and confirm
6. Process payment
7. Display success/receipt

## 9. Data Visualization

### 9.1 Chart Requirements

- Color-blind friendly palette
- High contrast for visibility
- Text alternatives for screen readers
- Touch-friendly interactions

### 9.2 Chart Types

- **Line Chart**: Usage over time
- **Bar Chart**: Service comparison
- **Pie Chart**: Usage distribution
- **Area Chart**: Cumulative usage

## 10. Performance Considerations

### 10.1 Optimization Strategies

- Virtual scrolling for large transaction lists
- Chart data sampling for performance
- Image optimization for package images
- Debounced search and filtering

### 10.2 Bundle Optimization

- Code splitting for payment components
- Dynamic imports for chart libraries
- Lazy loading of transaction history
- Minimal impact on initial load

## 11. API Integration

### 11.1 Required Endpoints

- `GET /api/credits/balance` - Current balance
- `GET /api/credits/transactions` - Transaction history
- `GET /api/credits/packages` - Available packages
- `POST /api/credits/purchase` - Process purchase
- `POST /api/credits/promo/apply` - Apply promo code
- `GET /api/credits/usage` - Usage analytics

### 11.2 WebSocket Events

- `balance_updated` - Real-time balance updates
- `transaction_completed` - New transaction notifications
- `payment_processed` - Payment completion updates

## 12. Testing Requirements

### 12.1 Unit Tests

- Component rendering
- State management actions
- Utility functions
- Data formatting

### 12.2 Integration Tests

- Payment flows
- Promo code redemption
- Data fetching
- WebSocket connections

### 12.3 E2E Tests

- Complete purchase flow
- Transaction history viewing
- Usage analytics
- Error scenarios

## 13. Wireframes

### 13.1 Credit Purchase Flow (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│                    Buy Credits                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Select Package:                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │  100     │ │  500    │ │  1000   │ │  5000   │        │
│ │ Credits  │ │ Credits │ │ Credits │ │ Credits │        │
│ │ $10.00   │ │ $45.00  │ │ $85.00  │ │ $400.00 │        │
│ │          │ │ Popular │ │ Best    │ │          │        │
│ │          │ │         │ │ Value   │ │          │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                         │
│  Payment Method:                                        │
│  ┌─────────────────────────────────────────────────────┐ │
│ │ ● Credit Card                                        │ │
│ │   ○ PayPal                                           │ │
│ │   ○ Apple Pay                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Card Details:                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐        │
│ │ Card Number          │ │ MM/YY               │        │
│ └─────────────────────┘ └─────────────────────┘        │
│  ┌─────────────────────┐ ┌─────────────────────┐        │
│ │ Name on Card         │ │ CVC                 │        │
│ └─────────────────────┘ └─────────────────────┘        │
│                                                         │
│  Promo Code: [Enter code] [Apply]                       │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│ │ Summary:                                             │ │
│ │ Package:     1000 Credits                           │ │
│ │ Price:       $85.00                                 │ │
│ │ Discount:    -$10.00                                │ │
│ │ Total:       $75.00                                 │ │
│ │                                                     │ │
│ │              [Purchase Credits]                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 13.2 Transaction History (Mobile)

```
┌─────────────────┐
│ Transaction     │
│ History         │
├─────────────────┤
│ 🔍 [Search]     │
│ 📅 [Date] ⚙️    │
├─────────────────┤
│ ┌─────────────┐ │
│ │ +$100.00    │ │
│ │ Purchase    │ │
│ │ 2 hours ago │ │
│ │ Stripe      │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ -$5.00      │ │
│ │ GPT-4 Usage │ │
│ │ 5 hours ago │ │
│ │ API Call    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ +$20.00     │ │
│ │ Promo Code  │ │
│ │ Yesterday   │ │
│ │ WELCOME10   │ │
│ └─────────────┘ │
├─────────────────┤
│ [Load More]     │
│ [Export CSV]    │
└─────────────────┘
```

## 14. Implementation Checklist

- [ ] Create CreditBalanceCard component
- [ ] Implement CreditPurchaseForm
- [ ] Create TransactionHistory component
- [ ] Implement UsageAnalytics
- [ ] Create PromoCodeSection
- [ ] Set up Zustand credit store
- [ ] Implement payment integration
- [ ] Add WebSocket support
- [ ] Ensure responsive design
- [ ] Add accessibility features
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create Storybook stories
- [ ] Performance optimization
- [ ] Security review
- [ ] Error handling implementation

---

**หมายเหตุ:** เอกสารนี้เป็นส่วนหนึ่งของ Frontend Specifications และจะถูกอัปเดตตามความจำเป็น