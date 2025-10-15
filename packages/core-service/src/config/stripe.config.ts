import Stripe from 'stripe';

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
} as any);

// Define credit packages
export const creditPackages = {
  starter: {
    name: 'Starter',
    credits: 100,
    price: 1000, // $10.00 in cents
    priceId: 'price_starter', // Replace with your actual Price ID from Stripe
  },
  pro: {
    name: 'Pro',
    credits: 1000,
    price: 8000, // $80.00 in cents
    priceId: 'price_pro', // Replace with your actual Price ID from Stripe
  },
  business: {
    name: 'Business',
    credits: 10000,
    price: 60000, // $600.00 in cents
    priceId: 'price_business', // Replace with your actual Price ID from Stripe
  },
};

export type CreditPackageId = keyof typeof creditPackages;
