const axios = require('axios');

class WebhookService {
  constructor() {
    this.webhookServiceUrl = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:3005';
    this.internalSecret = process.env.INTERNAL_SERVICE_SECRET;
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(eventType, userId, data, metadata = {}) {
    try {
      if (!this.internalSecret) {
        console.warn('Webhook service integration not configured - skipping webhook trigger');
        return;
      }

      const payload = {
        eventType,
        userId,
        data,
        metadata: {
          ...metadata,
          service: 'auth-service',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await axios.post(
        `${this.webhookServiceUrl}/internal/webhooks/trigger`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.internalSecret}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 seconds timeout
        }
      );

      console.log(`Webhook triggered successfully: ${eventType} for user ${userId}`);
      return response.data;
    } catch (error) {
      // Log error but don't fail the main operation
      console.error(`Failed to trigger webhook: ${eventType} for user ${userId}:`, error.message);
      
      if (error.response) {
        console.error('Webhook service response:', error.response.status, error.response.data);
      }
    }
  }

  /**
   * Trigger user.created event
   */
  async triggerUserCreated(user, additionalData = {}) {
    return await this.triggerEvent('user.created', user.id, {
      id: user.id,
      email: user.email,
      verified: user.verified,
      roles: user.roles || [],
      createdAt: user.createdAt || new Date().toISOString(),
    }, {
      source: 'registration',
      ...additionalData,
    });
  }

  /**
   * Trigger user.verified event (when user verifies email)
   */
  async triggerUserVerified(user) {
    return await this.triggerEvent('user.verified', user.id, {
      id: user.id,
      email: user.email,
      verifiedAt: new Date().toISOString(),
    }, {
      source: 'email_verification',
    });
  }

  /**
   * Trigger user.login event
   */
  async triggerUserLogin(user, loginData = {}) {
    return await this.triggerEvent('user.login', user.id, {
      id: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
    }, {
      source: 'login',
      ip: loginData.ip,
      userAgent: loginData.userAgent,
    });
  }

  /**
   * Trigger user.logout event
   */
  async triggerUserLogout(user, logoutData = {}) {
    return await this.triggerEvent('user.logout', user.id, {
      id: user.id,
      email: user.email,
      logoutAt: new Date().toISOString(),
    }, {
      source: 'logout',
      ip: logoutData.ip,
      userAgent: logoutData.userAgent,
    });
  }

  /**
   * Trigger user.password_changed event
   */
  async triggerPasswordChanged(user) {
    return await this.triggerEvent('user.password_changed', user.id, {
      id: user.id,
      email: user.email,
      changedAt: new Date().toISOString(),
    }, {
      source: 'password_change',
    });
  }

  /**
   * Trigger user.profile_updated event
   */
  async triggerProfileUpdated(user, profileData) {
    return await this.triggerEvent('user.profile_updated', user.id, {
      id: user.id,
      email: user.email,
      profile: profileData,
      updatedAt: new Date().toISOString(),
    }, {
      source: 'profile_update',
    });
  }

  /**
   * Trigger user.roles_assigned event
   */
  async triggerRolesAssigned(user, roles) {
    return await this.triggerEvent('user.roles_assigned', user.id, {
      id: user.id,
      email: user.email,
      roles: roles,
      assignedAt: new Date().toISOString(),
    }, {
      source: 'role_assignment',
    });
  }

  /**
   * Check if webhook service is available
   */
  async checkHealth() {
    try {
      const response = await axios.get(
        `${this.webhookServiceUrl}/internal/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.internalSecret}`,
          },
          timeout: 3000,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Webhook service health check failed:', error.message);
      return null;
    }
  }
}

module.exports = new WebhookService();