export interface CreditBalance {
    balance: number;
    lastUpdate: Date;
}
export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    type: 'purchase' | 'usage' | 'refund' | 'admin_adjustment' | 'promo';
    description: string | null;
    createdAt: Date;
}
export interface CreditHistory {
    data: CreditTransaction[];
    total: number;
}
export interface PromoCodeResult {
    success: boolean;
    credits: number;
    message: string;
}
/**
 * Get user's current credit balance
 */
export declare const getBalance: (userId: string) => Promise<number>;
/**
 * Get user's credit transaction history
 */
export declare const getHistory: (userId: string, page: number, limit: number) => Promise<{
    data: CreditTransaction[];
    total: number;
}>;
/**
 * Redeem a promo code for credits
 */
export declare const redeemPromo: (userId: string, code: string) => Promise<number>;
/**
 * Adjust user credits (admin only)
 */
export declare const adjustCredits: (userId: string, amount: number, reason: string) => Promise<number>;
/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export declare const disconnectRedis: () => Promise<void>;
//# sourceMappingURL=credit.service.d.ts.map