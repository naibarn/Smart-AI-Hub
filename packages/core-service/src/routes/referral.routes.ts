import { Router } from 'express';
import {
  getInviteLink,
  getReferralStats,
  registerWithInviteCode,
  getReferralRewards,
} from '../controllers/referral.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { createCustomRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Apply authentication to all routes except register
router.use((req, res, next) => {
  if (req.path === '/register') {
    return next(); // Skip authentication for register endpoint
  }
  return authenticateJWT(req, res, next);
});

// Rate limiting for referral registration (max 3 registrations per minute)
const referralRegistrationLimit = createCustomRateLimiter(
  {
    guest: 3, // 3 registrations per minute for guests
    user: 5, // 5 registrations per minute for users
    manager: 10, // 10 registrations per minute for managers
    admin: 0, // No limit for admins
  },
  'referral_registration'
);

// Get invite link - all tiers
router.get('/invite-link', getInviteLink);

// Get referral statistics - all tiers
router.get('/stats', getReferralStats);

// Register with invite code - all tiers (public endpoint for new users)
router.post('/register', referralRegistrationLimit, registerWithInviteCode);

// Get referral rewards - all tiers
router.get('/rewards', getReferralRewards);

export default router;
