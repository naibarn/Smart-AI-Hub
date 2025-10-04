const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const { generateTokens } = require('../utils/jwt');

const prisma = new PrismaClient();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        role: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Extract profile information
    const { id, emails, name, photos } = profile;
    const email = emails[0].value;
    const firstName = name.givenName;
    const lastName = name.familyName;
    const picture = photos[0].value;

    // Log OAuth event for security
    console.log(`Google OAuth attempt for email: ${email}, Google ID: ${id}`);

    // Check if user exists by email
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        role: true
      }
    });

    if (user) {
      // User exists, check if already linked with Google
      if (user.googleId) {
        // Account already linked with Google
        if (user.googleId !== id) {
          // Security issue: Google ID mismatch
          console.error(`Security alert: Google ID mismatch for email ${email}. Existing: ${user.googleId}, New: ${id}`);
          return done(null, false, { message: 'Account already linked to a different Google account' });
        }
      } else {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: id,
            emailVerified: true // Mark as verified since Google verified the email
          },
          include: {
            profile: true,
            role: true
          }
        });
        console.log(`Google account linked to existing user: ${email}`);
      }
    } else {
      // Create new user with Google account
      // Get default "user" role
      const defaultRole = await prisma.role.findUnique({
        where: { name: 'user' }
      });

      user = await prisma.user.create({
        data: {
          email,
          googleId: id,
          emailVerified: true, // Auto-verified for OAuth users
          roleId: defaultRole?.id || null,
          profile: {
            create: {
              firstName,
              lastName,
              avatarUrl: picture
            }
          },
          creditAccount: {
            create: {
              currentBalance: 0,
              totalPurchased: 0,
              totalUsed: 0
            }
          }
        },
        include: {
          profile: true,
          role: true
        }
      });
      console.log(`New user created via Google OAuth: ${email}`);
    }

    // Generate JWT tokens
    const tokens = generateTokens(user.id);
    
    // Attach tokens to user object for callback
    user.tokens = tokens;
    
    return done(null, user);
  } catch (error) {
    console.error('Error in Google OAuth strategy:', error);
    return done(error, null);
  }
}));

module.exports = passport;