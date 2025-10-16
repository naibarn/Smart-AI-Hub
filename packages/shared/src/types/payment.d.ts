/**
 * Payment related types for Stripe Checkout integration
 */
export interface CreateCheckoutSessionRequest {
    packageId: string;
    quantity: number;
}
export interface CreateCheckoutSessionResponse {
    sessionId: string;
    url: string;
}
//# sourceMappingURL=payment.d.ts.map