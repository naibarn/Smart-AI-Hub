import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Define types for the API responses
export interface CheckoutSessionRequest {
  packageId: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  description?: string;
  features?: string[];
  popular?: boolean;
}

// Auth related types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  token?: string;
  refreshToken?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface ConfirmPasswordResetRequest {
  token: string;
  password: string;
}

export interface ConfirmPasswordResetResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  status: number;
  data: {
    message: string;
    error?: string;
  };
}

// Create the API slice
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Credits'],
  endpoints: (builder) => ({
    // Get available credit packages
    getCreditPackages: builder.query<CreditPackage[], void>({
      query: () => '/api/payments/packages',
      providesTags: ['Credits'],
    }),

    // Create a checkout session
    createCheckoutSession: builder.mutation<CheckoutSessionResponse, CheckoutSessionRequest>({
      query: (data) => ({
        url: '/api/payments/checkout-session',
        method: 'POST',
        body: data,
      }),
    }),

    // Get user's credit balance
    getCreditBalance: builder.query<
      {
        balance: number;
        currency: string;
      },
      void
    >({
      query: () => '/api/credits/balance',
      providesTags: ['Credits'],
    }),

    // Register a new user
    registerUser: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (data) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // Login user
    loginUser: builder.mutation<LoginResponse, LoginRequest>({
      query: (data) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: data,
      }),
    }),

    // Request password reset
    requestPasswordReset: builder.mutation<PasswordResetResponse, PasswordResetRequest>({
      query: (data) => ({
        url: '/api/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Confirm password reset
    confirmPasswordReset: builder.mutation<
      ConfirmPasswordResetResponse,
      ConfirmPasswordResetRequest
    >({
      query: (data) => ({
        url: '/api/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Verify email
    verifyEmail: builder.mutation<VerifyEmailResponse, VerifyEmailRequest>({
      query: (data) => ({
        url: '/api/auth/verify-email',
        method: 'POST',
        body: data,
      }),
    }),

    // Resend verification email
    resendVerification: builder.mutation<ResendVerificationResponse, ResendVerificationRequest>({
      query: (data) => ({
        url: '/api/auth/resend-verification',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks for using the endpoints
export const {
  useGetCreditPackagesQuery,
  useCreateCheckoutSessionMutation,
  useGetCreditBalanceQuery,
  useRegisterUserMutation,
  useLoginUserMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = api;
