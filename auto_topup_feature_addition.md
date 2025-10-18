---
title: 'Auto Top-up Feature Addition'
author: 'Development Team'
version: '1.0.0'
status: 'draft'
priority: 'high'
created_at: '2025-10-16'
updated_at: '2025-10-16'
type: 'specification'
description: "Focused addendum document for Auto Top-up Feature in Smart AI Hub's Credit Management System"
---

# Auto Top-up Feature Addition

## 1. Overview

This addendum document provides detailed specifications for the Auto Top-up Feature within Smart AI Hub's Credit Management System. The auto top-up functionality enables users to automatically replenish their credit accounts when balances fall below predefined thresholds, ensuring uninterrupted service usage and improved user experience. This document serves as a comprehensive reference for understanding, implementing, and maintaining the automated credit replenishment mechanisms that support continuous service operations while providing users with flexible configuration options.

## 2. Auto Top-up Logic

### 2.1 Core Auto Top-up Algorithm

The auto top-up system operates on a threshold-based trigger mechanism with configurable replenishment amounts and frequency controls. The system monitors credit account balances in real-time and automatically initiates top-up transactions when predefined conditions are met.

**Algorithm Steps:**

1. **Balance Monitoring**: Continuously monitor credit account balances
2. **Threshold Check**: Verify if balance falls below the configured threshold
3. **Trigger Validation**: Confirm auto top-up is enabled and conditions are met
4. **Frequency Control**: Ensure minimum time interval between top-ups has elapsed
5. **Payment Processing**: Execute payment through configured payment method
6. **Credit Addition**: Add purchased credits to user account
7. **Notification**: Send confirmation to user about successful top-up
8. **Logging**: Record transaction details for audit and reporting

### 2.2 Trigger Conditions

**Primary Trigger Condition:**

```typescript
interface TopupTriggerCondition {
  // Balance falls below this threshold to trigger auto top-up
  thresholdAmount: number;

  // Minimum balance required to initiate top-up
  minimumBalance: number;

  // Maximum balance after which auto top-up is disabled
  maximumBalance: number;

  // Only trigger if balance has been below threshold for this duration
  thresholdDurationMs: number;

  // Time of day restrictions for auto top-up
  allowedHours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };

  // Day of week restrictions
  allowedDays: number[]; // 0-6 (Sunday-Saturday)
}
```

**Secondary Conditions:**

- User account must be in good standing (not blocked or suspended)
- Payment method must be valid and have sufficient funds/limits
- Previous top-up must have completed successfully
- No pending manual top-up requests
- User has not exceeded monthly top-up limits

### 2.3 Top-up Amount Calculation

**Fixed Amount Strategy:**

```typescript
interface FixedAmountStrategy {
  type: 'fixed';
  amount: number; // Fixed amount to add each time
}
```

**Percentage-Based Strategy:**

```typescript
interface PercentageAmountStrategy {
  type: 'percentage';
  percentage: number; // Percentage of current balance to add
  minimumAmount: number; // Minimum amount to add
  maximumAmount: number; // Maximum amount to add
}
```

**Tiered Strategy:**

```typescript
interface TieredAmountStrategy {
  type: 'tiered';
  tiers: {
    threshold: number; // Balance threshold
    amount: number; // Amount to add when below this threshold
  }[];
}
```

**Dynamic Strategy:**

```typescript
interface DynamicAmountStrategy {
  type: 'dynamic';
  calculation: 'usage_based' | 'time_based' | 'predictive';
  parameters: {
    // Usage history analysis period (days)
    analysisPeriod?: number;

    // Target balance duration (days)
    targetDuration?: number;

    // Safety buffer percentage
    safetyBuffer?: number;

    // Maximum top-up amount
    maximumAmount?: number;
  };
}
```

### 2.4 Frequency Control Mechanisms

**Minimum Interval Control:**

```typescript
interface FrequencyControl {
  // Minimum time between auto top-ups
  minimumIntervalMs: number;

  // Maximum number of top-ups per day
  maxTopupsPerDay: number;

  // Maximum number of top-ups per week
  maxTopupsPerWeek: number;

  // Maximum number of top-ups per month
  maxTopupsPerMonth: number;

  // Maximum total amount per day
  maxAmountPerDay: number;

  // Maximum total amount per month
  maxAmountPerMonth: number;
}
```

**Cooldown Period Implementation:**

```typescript
async function checkCooldownPeriod(userId: string): Promise<CooldownResult> {
  const lastTopup = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: 'AUTO_TOPUP',
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!lastTopup) {
    return { canTopup: true, reason: 'No previous top-up found' };
  }

  const userSettings = await getUserAutoTopupSettings(userId);
  const timeSinceLastTopup = Date.now() - lastTopup.createdAt.getTime();

  if (timeSinceLastTopup < userSettings.frequencyControl.minimumIntervalMs) {
    const remainingTime = userSettings.frequencyControl.minimumIntervalMs - timeSinceLastTopup;
    return {
      canTopup: false,
      reason: 'Cooldown period active',
      remainingTimeMs: remainingTime,
    };
  }

  return { canTopup: true, reason: 'Cooldown period elapsed' };
}
```

## 3. Configuration Options

### 3.1 User Configuration Interface

**Auto Top-up Settings Structure:**

```typescript
interface AutoTopupSettings {
  // Master enable/disable switch
  enabled: boolean;

  // Trigger conditions
  triggerCondition: TopupTriggerCondition;

  // Amount calculation strategy
  amountStrategy:
    | FixedAmountStrategy
    | PercentageAmountStrategy
    | TieredAmountStrategy
    | DynamicAmountStrategy;

  // Frequency control
  frequencyControl: FrequencyControl;

  // Payment method configuration
  paymentMethod: {
    type: 'credit_card' | 'bank_account' | 'digital_wallet';
    identifier: string; // Tokenized payment method ID
    isDefault: boolean;
  };

  // Notification preferences
  notifications: {
    enabled: boolean;
    channels: ('email' | 'sms' | 'push')[];
    beforeTopup: boolean; // Notify before processing
    afterTopup: boolean; // Notify after completion
    onFailure: boolean; // Notify on failure
  };

  // Security settings
  security: {
    requireConfirmation: boolean; // Require confirmation for large amounts
    confirmationThreshold: number;
    biometricRequired: boolean;
    biometricThreshold: number;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  lastSuccessful?: Date;
}
```

**Configuration API Endpoints:**

```typescript
// Get current auto top-up settings
GET /api/v1/credits/auto-topup/settings

// Update auto top-up settings
PUT /api/v1/credits/auto-topup/settings
{
  "enabled": true,
  "triggerCondition": {
    "thresholdAmount": 100,
    "minimumBalance": 50,
    "maximumBalance": 10000,
    "thresholdDurationMs": 300000,
    "allowedHours": {
      "start": "06:00",
      "end": "22:00"
    },
    "allowedDays": [1, 2, 3, 4, 5]
  },
  "amountStrategy": {
    "type": "fixed",
    "amount": 500
  },
  "frequencyControl": {
    "minimumIntervalMs": 3600000,
    "maxTopupsPerDay": 3,
    "maxTopupsPerWeek": 10,
    "maxTopupsPerMonth": 30,
    "maxAmountPerDay": 2000,
    "maxAmountPerMonth": 5000
  },
  "paymentMethod": {
    "type": "credit_card",
    "identifier": "pm_1234567890",
    "isDefault": true
  },
  "notifications": {
    "enabled": true,
    "channels": ["email", "push"],
    "beforeTopup": false,
    "afterTopup": true,
    "onFailure": true
  },
  "security": {
    "requireConfirmation": true,
    "confirmationThreshold": 1000,
    "biometricRequired": false,
    "biometricThreshold": 2000
  }
}

// Test auto top-up configuration (dry run)
POST /api/v1/credits/auto-topup/test

// Get auto top-up history
GET /api/v1/credits/auto-topup/history

// Disable auto top-up immediately
POST /api/v1/credits/auto-topup/disable

// Enable auto top-up
POST /api/v1/credits/auto-topup/enable
```

### 3.2 System Configuration

**Global Auto Top-up Settings:**

```typescript
interface SystemAutoTopupConfig {
  // Global enable/disable for the entire system
  systemEnabled: boolean;

  // Default settings for new users
  defaultSettings: Partial<AutoTopupSettings>;

  // System-wide limits
  systemLimits: {
    maxThresholdAmount: number;
    maxTopupAmount: number;
    maxDailyTopupsPerUser: number;
    maxMonthlyTopupsPerUser: number;
    maxSystemDailyTopups: number;
    maxSystemMonthlyTopups: number;
  };

  // Processing configuration
  processing: {
    batchSize: number;
    processingIntervalMs: number;
    retryAttempts: number;
    retryDelayMs: number;
    timeoutMs: number;
  };

  // Payment processing
  payment: {
    defaultGateway: string;
    fallbackGateways: string[];
    processingFeePercentage: number;
    maxProcessingFee: number;
  };

  // Monitoring and alerts
  monitoring: {
    failureThreshold: number;
    alertRecipients: string[];
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

## 4. Edge Cases

### 4.1 Payment Failure Scenarios

**Insufficient Funds:**

```typescript
async function handleInsufficientFunds(
  userId: string,
  topupRequest: TopupRequest
): Promise<PaymentFailureResult> {
  // Log the failure
  await logPaymentFailure(userId, 'INSUFFICIENT_FUNDS', topupRequest);

  // Check if user has backup payment methods
  const backupMethods = await getBackupPaymentMethods(userId);

  if (backupMethods.length > 0) {
    // Try backup payment methods
    for (const method of backupMethods) {
      const result = await processPayment(method, topupRequest);
      if (result.success) {
        await updateDefaultPaymentMethod(userId, method.id);
        return { success: true, usedBackup: true, methodId: method.id };
      }
    }
  }

  // Notify user of payment failure
  await notifyPaymentFailure(userId, 'INSUFFICIENT_FUNDS', topupRequest);

  // Temporarily disable auto top-up to prevent repeated failures
  await temporarilyDisableAutoTopup(userId, 24 * 60 * 60 * 1000); // 24 hours

  return {
    success: false,
    reason: 'INSUFFICIENT_FUNDS',
    temporaryDisable: true,
    disableDurationMs: 24 * 60 * 60 * 1000,
  };
}
```

**Payment Gateway Unavailable:**

```typescript
async function handleGatewayUnavailable(
  userId: string,
  topupRequest: TopupRequest
): Promise<PaymentFailureResult> {
  // Log the gateway failure
  await logGatewayFailure(topupRequest.gateway);

  // Try fallback gateways
  const fallbackGateways = getFallbackGateways(topupRequest.gateway);

  for (const gateway of fallbackGateways) {
    try {
      const result = await processPaymentWithGateway(gateway, topupRequest);
      if (result.success) {
        await logGatewayRecovery(topupRequest.gateway, gateway);
        return { success: true, usedFallback: true, gateway };
      }
    } catch (error) {
      await logGatewayFailure(gateway);
    }
  }

  // All gateways failed - queue for retry
  await queueForRetry(userId, topupRequest);

  return {
    success: false,
    reason: 'ALL_GATEWAYS_UNAVAILABLE',
    queuedForRetry: true,
  };
}
```

**Payment Method Expired:**

```typescript
async function handleExpiredPaymentMethod(
  userId: string,
  topupRequest: TopupRequest
): Promise<PaymentFailureResult> {
  // Mark payment method as expired
  await markPaymentMethodExpired(topupRequest.paymentMethodId);

  // Check for other valid payment methods
  const validMethods = await getValidPaymentMethods(userId);

  if (validMethods.length > 0) {
    // Update auto top-up settings with new default
    await updateDefaultPaymentMethod(userId, validMethods[0].id);

    // Notify user about payment method change
    await notifyPaymentMethodChanged(userId, validMethods[0]);

    // Retry with new payment method
    const newRequest = { ...topupRequest, paymentMethodId: validMethods[0].id };
    return await processPayment(newRequest);
  }

  // No valid payment methods - disable auto top-up
  await disableAutoTopup(userId, 'NO_VALID_PAYMENT_METHOD');

  // Notify user to update payment information
  await notifyPaymentMethodRequired(userId);

  return {
    success: false,
    reason: 'NO_VALID_PAYMENT_METHOD',
    autoTopupDisabled: true,
  };
}
```

### 4.2 System Overload Scenarios

**High Volume Processing:**

```typescript
async function handleHighVolumeLoad(): Promise<void> {
  // Get current system load metrics
  const systemLoad = await getSystemLoadMetrics();

  if (systemLoad.queueSize > HIGH_VOLUME_THRESHOLD) {
    // Implement priority processing
    await enablePriorityProcessing();

    // Increase processing batch size
    await increaseProcessingBatchSize();

    // Scale up processing resources if available
    await scaleUpProcessingResources();
  }

  if (systemLoad.processingTime > SLOW_PROCESSING_THRESHOLD) {
    // Implement circuit breaker pattern
    await enableCircuitBreaker();

    // Redirect to alternative processing queues
    await enableAlternativeQueues();

    // Notify system administrators
    await notifyHighVolumeAlert(systemLoad);
  }
}
```

**Database Connection Issues:**

```typescript
async function handleDatabaseConnectionIssues(
  userId: string,
  topupRequest: TopupRequest
): Promise<ProcessingResult> {
  // Try to reconnect to database
  const reconnected = await attemptDatabaseReconnection();

  if (reconnected) {
    // Retry the original request
    return await processAutoTopup(userId, topupRequest);
  }

  // Queue request for later processing
  await queueForLaterProcessing(userId, topupRequest);

  // Use cache for critical operations
  const cachedBalance = await getCachedBalance(userId);

  if (cachedBalance && cachedBalance < topupRequest.thresholdAmount) {
    // Allow top-up based on cached data
    return await processPaymentWithMinimalValidation(topupRequest);
  }

  return {
    success: false,
    reason: 'DATABASE_UNAVAILABLE',
    queuedForLater: true,
  };
}
```

### 4.3 User Account Edge Cases

**Account Status Changes:**

```typescript
async function handleAccountStatusChange(
  userId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  // Disable auto top-up for suspended/blocked accounts
  if (newStatus === 'suspended' || newStatus === 'blocked') {
    await disableAutoTopup(userId, `Account status changed to ${newStatus}`);
    await notifyAutoTopupDisabled(userId, newStatus);
    return;
  }

  // Re-enable auto top-up for reactivated accounts
  if (oldStatus === 'suspended' && newStatus === 'active') {
    const previousSettings = await getPreviousAutoTopupSettings(userId);

    if (previousSettings && previousSettings.enabled) {
      await enableAutoTopup(userId);
      await notifyAutoTopupReenabled(userId);
    }
  }

  // Update user tier if changed
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.tier !== oldStatus) {
    await adjustAutoTopupSettingsForTier(userId, user.tier);
  }
}
```

**Credit Limit Changes:**

```typescript
async function handleCreditLimitChange(
  userId: string,
  oldLimit: number,
  newLimit: number
): Promise<void> {
  const userSettings = await getUserAutoTopupSettings(userId);

  // Adjust threshold if it's above new limit
  if (userSettings.triggerCondition.thresholdAmount > newLimit) {
    const newThreshold = Math.floor(newLimit * 0.2); // 20% of new limit
    await updateThresholdAmount(userId, newThreshold);
    await notifyThresholdAdjusted(userId, newThreshold, newLimit);
  }

  // Adjust maximum balance if it's above new limit
  if (userSettings.triggerCondition.maximumBalance > newLimit) {
    const newMaxBalance = Math.floor(newLimit * 0.9); // 90% of new limit
    await updateMaximumBalance(userId, newMaxBalance);
    await notifyMaxBalanceAdjusted(userId, newMaxBalance, newLimit);
  }

  // Adjust top-up amount if it exceeds new limit
  const topupAmount = getTopupAmount(userSettings.amountStrategy);
  if (topupAmount > newLimit) {
    const newAmount = Math.floor(newLimit * 0.5); // 50% of new limit
    await updateTopupAmount(userId, newAmount);
    await notifyTopupAmountAdjusted(userId, newAmount, newLimit);
  }
}
```

### 4.4 Payment Method Edge Cases

**Multiple Payment Methods:**

```typescript
async function handleMultiplePaymentMethods(
  userId: string,
  topupRequest: TopupRequest
): Promise<PaymentResult> {
  const paymentMethods = await getUserPaymentMethods(userId);
  const defaultMethod = paymentMethods.find((m) => m.isDefault);

  // Try default payment method first
  if (defaultMethod) {
    const result = await processPayment(defaultMethod, topupRequest);
    if (result.success) {
      return result;
    }

    // Log failure with default method
    await logPaymentMethodFailure(defaultMethod.id, result.reason);
  }

  // Try alternative payment methods in order of preference
  const alternativeMethods = paymentMethods
    .filter((m) => !m.isDefault)
    .sort((a, b) => a.preference - b.preference);

  for (const method of alternativeMethods) {
    const result = await processPayment(method, topupRequest);
    if (result.success) {
      // Update default to successful method
      await updateDefaultPaymentMethod(userId, method.id);
      await notifyDefaultPaymentMethodChanged(userId, method.id);
      return { ...result, usedAlternative: true, methodId: method.id };
    }

    await logPaymentMethodFailure(method.id, result.reason);
  }

  // All payment methods failed
  await notifyAllPaymentMethodsFailed(userId);
  return { success: false, reason: 'ALL_PAYMENT_METHODS_FAILED' };
}
```

**Payment Method Expiration Handling:**

```typescript
async function handlePaymentMethodExpiration(): Promise<void> {
  // Find payment methods expiring in next 30 days
  const expiringMethods = await prisma.paymentMethod.findMany({
    where: {
      expirationDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
      isActive: true,
    },
  });

  for (const method of expiringMethods) {
    // Notify users about upcoming expiration
    await notifyPaymentMethodExpiring(method.userId, method);

    // Check if user has auto top-up enabled with this method
    const autoTopupSettings = await getUserAutoTopupSettings(method.userId);
    if (autoTopupSettings.enabled && autoTopupSettings.paymentMethod.identifier === method.id) {
      // Find alternative payment methods
      const alternatives = await getAlternativePaymentMethods(method.userId, method.id);

      if (alternatives.length > 0) {
        // Prompt user to switch to alternative
        await notifyPaymentMethodSwitchRequired(method.userId, method, alternatives);
      } else {
        // Warn user about auto top-up interruption
        await notifyAutoTopupInterruption(method.userId, method);
      }
    }
  }
}
```

## 5. Test Scenarios

### 5.1 Basic Functionality Tests

**Test Case 1: Standard Auto Top-up Trigger**

```typescript
describe('Standard Auto Top-up Trigger', () => {
  test('Triggers auto top-up when balance falls below threshold', async () => {
    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Trigger auto top-up check
    await processAutoTopupChecks();

    // Verify top-up was processed
    const transactions = await getCreditTransactions(user.id);
    const topupTransaction = transactions.find((t) => t.type === 'AUTO_TOPUP');

    expect(topupTransaction).toBeDefined();
    expect(topupTransaction.amount).toBe(500);
    expect(topupTransaction.status).toBe('COMPLETED');

    // Verify balance was updated
    const finalBalance = await getUserBalance(user.id);
    expect(finalBalance).toBe(550); // 50 + 500
  });
});
```

**Test Case 2: Auto Top-up Disabled**

```typescript
describe('Auto Top-up Disabled', () => {
  test('Does not trigger when auto top-up is disabled', async () => {
    const user = await createUserWithAutoTopup({
      enabled: false,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Trigger auto top-up check
    await processAutoTopupChecks();

    // Verify no top-up was processed
    const transactions = await getCreditTransactions(user.id);
    const topupTransaction = transactions.find((t) => t.type === 'AUTO_TOPUP');

    expect(topupTransaction).toBeUndefined();

    // Verify balance remains unchanged
    const finalBalance = await getUserBalance(user.id);
    expect(finalBalance).toBe(50);
  });
});
```

**Test Case 3: Frequency Control Enforcement**

```typescript
describe('Frequency Control Enforcement', () => {
  test('Respects minimum interval between top-ups', async () => {
    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      minimumIntervalMs: 3600000, // 1 hour
      paymentMethod: validPaymentMethod,
    });

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Trigger first auto top-up
    await processAutoTopupChecks();

    // Verify first top-up was processed
    let transactions = await getCreditTransactions(user.id);
    expect(transactions.filter((t) => t.type === 'AUTO_TOPUP')).toHaveLength(1);

    // Immediately trigger second check (should be blocked by frequency control)
    await processAutoTopupChecks();

    // Verify second top-up was not processed
    transactions = await getCreditTransactions(user.id);
    expect(transactions.filter((t) => t.type === 'AUTO_TOPUP')).toHaveLength(1);
  });
});
```

### 5.2 Payment Processing Tests

**Test Case 4: Successful Payment Processing**

```typescript
describe('Successful Payment Processing', () => {
  test('Processes payment successfully and adds credits', async () => {
    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Mock successful payment response
    mockPaymentGateway.successfulResponse();

    // Trigger auto top-up
    await processAutoTopupChecks();

    // Verify payment was processed
    const paymentTransactions = await getPaymentTransactions(user.id);
    expect(paymentTransactions).toHaveLength(1);
    expect(paymentTransactions[0].status).toBe('COMPLETED');
    expect(paymentTransactions[0].amount).toBe(500);

    // Verify credits were added
    const creditTransactions = await getCreditTransactions(user.id);
    const topupTransaction = creditTransactions.find((t) => t.type === 'AUTO_TOPUP');
    expect(topupTransaction.status).toBe('COMPLETED');
    expect(topupTransaction.amount).toBe(500);
  });
});
```

**Test Case 5: Payment Failure Handling**

```typescript
describe('Payment Failure Handling', () => {
  test('Handles payment failure gracefully', async () => {
    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Mock payment failure
    mockPaymentGateway.failureResponse('INSUFFICIENT_FUNDS');

    // Trigger auto top-up
    await processAutoTopupChecks();

    // Verify failed payment was recorded
    const paymentTransactions = await getPaymentTransactions(user.id);
    expect(paymentTransactions).toHaveLength(1);
    expect(paymentTransactions[0].status).toBe('FAILED');
    expect(paymentTransactions[0].failureReason).toBe('INSUFFICIENT_FUNDS');

    // Verify no credits were added
    const creditTransactions = await getCreditTransactions(user.id);
    const topupTransaction = creditTransactions.find((t) => t.type === 'AUTO_TOPUP');
    expect(topupTransaction).toBeUndefined();

    // Verify user was notified
    expect(notifyPaymentFailure).toHaveBeenCalledWith(
      user.id,
      'INSUFFICIENT_FUNDS',
      expect.any(Object)
    );
  });
});
```

**Test Case 6: Backup Payment Method Usage**

```typescript
describe('Backup Payment Method Usage', () => {
  test('Uses backup payment method when primary fails', async () => {
    const backupPaymentMethod = await createPaymentMethod(user.id, { isDefault: false });

    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Add backup payment method
    await addPaymentMethod(user.id, backupPaymentMethod);

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Mock primary payment failure and backup success
    mockPaymentGateway.failureWithMethod(validPaymentMethod.id, 'INSUFFICIENT_FUNDS');
    mockPaymentGateway.successWithMethod(backupPaymentMethod.id);

    // Trigger auto top-up
    await processAutoTopupChecks();

    // Verify backup payment was used
    const paymentTransactions = await getPaymentTransactions(user.id);
    expect(paymentTransactions).toHaveLength(2);
    expect(paymentTransactions[0].status).toBe('FAILED');
    expect(paymentTransactions[1].status).toBe('COMPLETED');
    expect(paymentTransactions[1].paymentMethodId).toBe(backupPaymentMethod.id);

    // Verify credits were added
    const creditTransactions = await getCreditTransactions(user.id);
    const topupTransaction = creditTransactions.find((t) => t.type === 'AUTO_TOPUP');
    expect(topupTransaction.status).toBe('COMPLETED');

    // Verify backup method is now default
    const updatedSettings = await getUserAutoTopupSettings(user.id);
    expect(updatedSettings.paymentMethod.identifier).toBe(backupPaymentMethod.id);
  });
});
```

### 5.3 Edge Case Tests

**Test Case 7: System Load Handling**

```typescript
describe('System Load Handling', () => {
  test('Handles high system load gracefully', async () => {
    const users = await createMultipleUsersWithAutoTopup(100, {
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
    });

    // Set all balances below threshold
    for (const user of users) {
      await updateUserBalance(user.id, 50);
    }

    // Simulate high system load
    mockSystemLoad(HIGH_VOLUME_THRESHOLD + 1);

    // Trigger auto top-up checks
    const startTime = Date.now();
    await processAutoTopupChecks();
    const processingTime = Date.now() - startTime;

    // Verify all top-ups were eventually processed
    for (const user of users) {
      const transactions = await getCreditTransactions(user.id);
      const topupTransaction = transactions.find((t) => t.type === 'AUTO_TOPUP');
      expect(topupTransaction).toBeDefined();
    }

    // Verify processing time is reasonable
    expect(processingTime).toBeLessThan(MAX_PROCESSING_TIME);

    // Verify system adapted to high load
    expect(enablePriorityProcessing).toHaveBeenCalled();
    expect(increaseProcessingBatchSize).toHaveBeenCalled();
  });
});
```

**Test Case 8: Database Connection Issues**

```typescript
describe('Database Connection Issues', () => {
  test('Handles database connection issues', async () => {
    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Mock database connection failure
    mockDatabaseConnectionFailure();

    // Trigger auto top-up
    await processAutoTopupChecks();

    // Verify request was queued for later processing
    const queuedRequests = await getQueuedTopupRequests();
    expect(queuedRequests).toHaveLength(1);
    expect(queuedRequests[0].userId).toBe(user.id);

    // Restore database connection
    restoreDatabaseConnection();

    // Process queued requests
    await processQueuedTopupRequests();

    // Verify top-up was processed after reconnection
    const transactions = await getCreditTransactions(user.id);
    const topupTransaction = transactions.find((t) => t.type === 'AUTO_TOPUP');
    expect(topupTransaction).toBeDefined();
    expect(topupTransaction.status).toBe('COMPLETED');
  });
});
```

**Test Case 9: Account Status Changes**

```typescript
describe('Account Status Changes', () => {
  test('Disables auto top-up when account is suspended', async () => {
    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Suspend user account
    await updateUserStatus(user.id, 'suspended');

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Trigger auto top-up
    await processAutoTopupChecks();

    // Verify no top-up was processed
    const transactions = await getCreditTransactions(user.id);
    const topupTransaction = transactions.find((t) => t.type === 'AUTO_TOPUP');
    expect(topupTransaction).toBeUndefined();

    // Verify auto top-up was disabled
    const settings = await getUserAutoTopupSettings(user.id);
    expect(settings.enabled).toBe(false);

    // Verify user was notified
    expect(notifyAutoTopupDisabled).toHaveBeenCalledWith(user.id, 'suspended');
  });
});
```

### 5.4 Performance Tests

**Test Case 10: Concurrent Processing**

```typescript
describe('Concurrent Processing', () => {
  test('Handles concurrent auto top-up requests', async () => {
    const users = await createMultipleUsersWithAutoTopup(50, {
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Set all balances below threshold
    for (const user of users) {
      await updateUserBalance(user.id, 50);
    }

    // Trigger concurrent auto top-up checks
    const promises = users.map((user) => processAutoTopupForUser(user.id));
    const results = await Promise.all(promises);

    // Verify all top-ups were processed successfully
    expect(results.every((r) => r.success)).toBe(true);

    // Verify all users received credits
    for (const user of users) {
      const transactions = await getCreditTransactions(user.id);
      const topupTransaction = transactions.find((t) => t.type === 'AUTO_TOPUP');
      expect(topupTransaction).toBeDefined();
      expect(topupTransaction.status).toBe('COMPLETED');
    }

    // Verify no duplicate transactions
    for (const user of users) {
      const transactions = await getCreditTransactions(user.id);
      const topupTransactions = transactions.filter((t) => t.type === 'AUTO_TOPUP');
      expect(topupTransactions).toHaveLength(1);
    }
  });
});
```

**Test Case 11: Large Volume Processing**

```typescript
describe('Large Volume Processing', () => {
  test('Processes large volume of top-ups efficiently', async () => {
    const users = await createMultipleUsersWithAutoTopup(1000, {
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
    });

    // Set all balances below threshold
    for (const user of users) {
      await updateUserBalance(user.id, 50);
    }

    // Measure processing time
    const startTime = Date.now();
    await processAutoTopupChecks();
    const processingTime = Date.now() - startTime;

    // Verify processing time is within acceptable limits
    expect(processingTime).toBeLessThan(MAX_BATCH_PROCESSING_TIME);

    // Verify all top-ups were processed
    let successCount = 0;
    for (const user of users) {
      const transactions = await getCreditTransactions(user.id);
      const topupTransaction = transactions.find((t) => t.type === 'AUTO_TOPUP');
      if (topupTransaction && topupTransaction.status === 'COMPLETED') {
        successCount++;
      }
    }

    expect(successCount).toBe(users.length);
  });
});
```

### 5.5 Integration Tests

**Test Case 12: End-to-End Auto Top-up Flow**

```typescript
describe('End-to-End Auto Top-up Flow', () => {
  test('Completes full auto top-up flow from trigger to notification', async () => {
    const user = await createUserWithAutoTopup({
      enabled: true,
      thresholdAmount: 100,
      topupAmount: 500,
      paymentMethod: validPaymentMethod,
      notifications: {
        enabled: true,
        channels: ['email', 'push'],
        beforeTopup: false,
        afterTopup: true,
        onFailure: true,
      },
    });

    // Set balance below threshold
    await updateUserBalance(user.id, 50);

    // Mock successful payment
    mockPaymentGateway.successfulResponse();

    // Trigger auto top-up
    await processAutoTopupChecks();

    // Verify payment was processed
    const paymentTransactions = await getPaymentTransactions(user.id);
    expect(paymentTransactions).toHaveLength(1);
    expect(paymentTransactions[0].status).toBe('COMPLETED');

    // Verify credits were added
    const creditTransactions = await getCreditTransactions(user.id);
    const topupTransaction = creditTransactions.find((t) => t.type === 'AUTO_TOPUP');
    expect(topupTransaction.status).toBe('COMPLETED');

    // Verify balance was updated
    const finalBalance = await getUserBalance(user.id);
    expect(finalBalance).toBe(550);

    // Verify user was notified
    expect(notifyAutoTopupSuccess).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        amount: 500,
        newBalance: 550,
      })
    );

    // Verify email notification was sent
    expect(sendEmail).toHaveBeenCalledWith(
      user.email,
      'Auto Top-up Successful',
      expect.stringContaining('500 credits have been added')
    );

    // Verify push notification was sent
    expect(sendPushNotification).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        title: 'Auto Top-up Successful',
        body: expect.stringContaining('500 credits'),
      })
    );
  });
});
```

This addendum document provides comprehensive specifications for the Auto Top-up Feature, including detailed logic implementation, configuration options, edge case handling, and thorough test scenarios. The auto top-up system is designed to be reliable, secure, and user-friendly, ensuring uninterrupted service while maintaining proper controls and safeguards.
