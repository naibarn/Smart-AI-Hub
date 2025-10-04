// src/services/email.service.js
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    // Initialize SendGrid with API key
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      console.warn('SENDGRID_API_KEY not found in environment variables');
    }
  }

  /**
   * Send verification email with OTP
   * @param {string} email - Recipient email
   * @param {string} otp - 6-digit OTP code
   * @param {object} options - Additional options
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendVerificationEmail(email, otp, options = {}) {
    try {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@smartaihub.com';
      const expiryMinutes = Math.floor((parseInt(process.env.VERIFICATION_OTP_EXPIRY) || 900) / 60);
      
      const msg = {
        to: email,
        from: fromEmail,
        subject: 'Verify Your Email - Smart AI Hub',
        html: this.generateVerificationTemplate(otp, expiryMinutes),
        text: this.generateVerificationText(otp, expiryMinutes),
        ...options
      };

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      // Return detailed error information
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Generate HTML email template for verification
   * @param {string} otp - OTP code
   * @param {number} expiryMinutes - Expiry time in minutes
   * @returns {string} HTML email content
   */
  generateVerificationTemplate(otp, expiryMinutes) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - Smart AI Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .otp-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            background: rgba(255, 255, 255, 0.2);
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
        }
        .info-box {
            background-color: #f3f4f6;
            border-left: 4px solid #4f46e5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box h3 {
            margin-top: 0;
            color: #4f46e5;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .support-link {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
        .support-link:hover {
            text-decoration: underline;
        }
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
        .expiry-info {
            font-size: 18px;
            color: #ffffff;
            margin-top: 15px;
        }
        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 Smart AI Hub</div>
            <h1 class="title">Email Verification</h1>
        </div>

        <p>Hello,</p>
        
        <p>Thank you for signing up with Smart AI Hub! To complete your registration and verify your email address, please use the following verification code:</p>

        <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <div class="expiry-info">Valid for ${expiryMinutes} minutes</div>
        </div>

        <div class="security-note">
            <strong>🔒 Security Notice:</strong> Never share this verification code with anyone. Our team will never ask for your verification code via email, phone, or any other method.
        </div>

        <div class="info-box">
            <h3>How to verify your email:</h3>
            <ol>
                <li>Copy the 6-digit verification code above</li>
                <li>Return to the Smart AI Hub application</li>
                <li>Enter the code in the verification field</li>
                <li>Click "Verify Email" to complete the process</li>
            </ol>
        </div>

        <p>If you didn't request this verification, you can safely ignore this email. The verification code will automatically expire after ${expiryMinutes} minutes.</p>

        <div class="footer">
            <p>Need help? Contact our support team at <a href="mailto:support@smartaihub.com" class="support-link">support@smartaihub.com</a></p>
            <p>&copy; 2024 Smart AI Hub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text version of verification email
   * @param {string} otp - OTP code
   * @param {number} expiryMinutes - Expiry time in minutes
   * @returns {string} Plain text email content
   */
  generateVerificationText(otp, expiryMinutes) {
    return `
SMART AI HUB - EMAIL VERIFICATION

Hello,

Thank you for signing up with Smart AI Hub! Please use the following verification code to verify your email address:

Verification Code: ${otp}
Valid for: ${expiryMinutes} minutes

How to verify:
1. Copy the 6-digit verification code above
2. Return to the Smart AI Hub application
3. Enter the code in the verification field
4. Click "Verify Email" to complete the process

SECURITY NOTICE: Never share this verification code with anyone. Our team will never ask for your verification code.

If you didn't request this verification, you can safely ignore this email. The code will automatically expire.

Need help? Contact support@smartaihub.com

© 2024 Smart AI Hub. All rights reserved.
`;
  }

  /**
   * Send welcome email after successful verification
   * @param {string} email - Recipient email
   * @param {string} firstName - User's first name (optional)
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendWelcomeEmail(email, firstName = '') {
    try {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@smartaihub.com';
      
      const msg = {
        to: email,
        from: fromEmail,
        subject: 'Welcome to Smart AI Hub! 🎉',
        html: this.generateWelcomeTemplate(firstName),
        text: this.generateWelcomeText(firstName)
      };

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Generate HTML welcome email template
   * @param {string} firstName - User's first name
   * @returns {string} HTML email content
   */
  generateWelcomeTemplate(firstName) {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Smart AI Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .welcome-box {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            color: white;
        }
        .cta-button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 Smart AI Hub</div>
            <h1 class="title">Welcome to Smart AI Hub!</h1>
        </div>

        <p>${greeting}</p>
        
        <p>Congratulations! Your email has been successfully verified and your account is now active. Welcome to the Smart AI Hub community!</p>

        <div class="welcome-box">
            <h2>🎉 You're All Set!</h2>
            <p>Your account is ready to use. Start exploring the power of AI with Smart AI Hub today.</p>
            <a href="https://smartaihub.com/dashboard" class="cta-button">Go to Dashboard</a>
        </div>

        <p>Here's what you can do next:</p>
        <ul>
            <li>Explore our AI-powered tools and services</li>
            <li>Set up your profile and preferences</li>
            <li>Check out our documentation and tutorials</li>
            <li>Join our community forum</li>
        </ul>

        <div class="footer">
            <p>Need help? Contact our support team at support@smartaihub.com</p>
            <p>&copy; 2024 Smart AI Hub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text welcome email
   * @param {string} firstName - User's first name
   * @returns {string} Plain text email content
   */
  generateWelcomeText(firstName) {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    
    return `
WELCOME TO SMART AI HUB

${greeting}

Congratulations! Your email has been successfully verified and your account is now active. Welcome to the Smart AI Hub community!

You're all set! Your account is ready to use. Start exploring the power of AI with Smart AI Hub today.

Visit your dashboard: https://smartaihub.com/dashboard

Here's what you can do next:
- Explore our AI-powered tools and services
- Set up your profile and preferences
- Check out our documentation and tutorials
- Join our community forum

Need help? Contact support@smartaihub.com

© 2024 Smart AI Hub. All rights reserved.
`;
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} resetToken - Reset token
   * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@smartaihub.com';
      const resetLink = `https://app.smartaihub.com/reset-password?token=${resetToken}`;
      
      const msg = {
        to: email,
        from: fromEmail,
        subject: 'Reset Your Password - Smart AI Hub',
        html: this.generatePasswordResetTemplate(resetLink),
        text: this.generatePasswordResetText(resetLink)
      };

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Generate HTML email template for password reset
   * @param {string} resetLink - Password reset link
   * @returns {string} HTML email content
   */
  generatePasswordResetTemplate(resetLink) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Smart AI Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
        }
        .reset-button:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        }
        .security-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            color: #92400e;
        }
        .security-box h3 {
            margin-top: 0;
            color: #b91c1c;
        }
        .info-box {
            background-color: #f3f4f6;
            border-left: 4px solid #4f46e5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .info-box h3 {
            margin-top: 0;
            color: #4f46e5;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .support-link {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
        .support-link:hover {
            text-decoration: underline;
        }
        .expiry-info {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #991b1b;
        }
        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            .reset-button {
                display: block;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 Smart AI Hub</div>
            <h1 class="title">Password Reset Request</h1>
        </div>

        <p>Hello,</p>
        
        <p>We received a request to reset your password for your Smart AI Hub account. If you made this request, please click the button below to reset your password:</p>

        <div style="text-align: center;">
            <a href="${resetLink}" class="reset-button">Reset Password</a>
        </div>

        <div class="expiry-info">
            <strong>⏰ Important:</strong> This password reset link will expire in 1 hour for security reasons.
        </div>

        <div class="security-box">
            <h3>🔒 Security Notice:</h3>
            <ul>
                <li>Never share this reset link with anyone</li>
                <li>Our team will never ask for your password or reset link</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged if you don't click the reset link</li>
            </ul>
        </div>

        <div class="info-box">
            <h3>How to reset your password:</h3>
            <ol>
                <li>Click the "Reset Password" button above</li>
                <li>You'll be taken to a secure page to create a new password</li>
                <li>Enter a strong password that meets our security requirements</li>
                <li>Confirm your new password and submit</li>
                <li>You'll be able to login with your new password immediately</li>
            </ol>
        </div>

        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${resetLink}
        </p>

        <p>If you didn't request a password reset, you can safely ignore this email. Your account security is important to us, and we recommend enabling two-factor authentication for additional protection.</p>

        <div class="footer">
            <p>Need help? Contact our support team at <a href="mailto:support@smartaihub.com" class="support-link">support@smartaihub.com</a></p>
            <p>&copy; 2024 Smart AI Hub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text version of password reset email
   * @param {string} resetLink - Password reset link
   * @returns {string} Plain text email content
   */
  generatePasswordResetText(resetLink) {
    return `
SMART AI HUB - PASSWORD RESET

Hello,

We received a request to reset your password for your Smart AI Hub account. If you made this request, please visit the link below to reset your password:

Reset Link: ${resetLink}

IMPORTANT: This password reset link will expire in 1 hour for security reasons.

SECURITY NOTICE:
- Never share this reset link with anyone
- Our team will never ask for your password or reset link
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged if you don't use the reset link

How to reset your password:
1. Click the reset link above or copy it to your browser
2. You'll be taken to a secure page to create a new password
3. Enter a strong password that meets our security requirements
4. Confirm your new password and submit
5. You'll be able to login with your new password immediately

If you didn't request a password reset, you can safely ignore this email. Your account security is important to us.

Need help? Contact support@smartaihub.com

© 2024 Smart AI Hub. All rights reserved.
`;
  }

  /**
   * Test email configuration
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testConfiguration() {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        return {
          success: false,
          error: 'SENDGRID_API_KEY not configured'
        };
      }

      // Send a test email to verify configuration
      const testEmail = process.env.SENDGRID_FROM_EMAIL;
      if (!testEmail) {
        return {
          success: false,
          error: 'SENDGRID_FROM_EMAIL not configured'
        };
      }

      const msg = {
        to: testEmail,
        from: testEmail,
        subject: 'Smart AI Hub - Email Service Test',
        text: 'This is a test email to verify the SendGrid configuration.',
        html: '<p>This is a test email to verify the SendGrid configuration.</p>'
      };

      await sgMail.send(msg);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();