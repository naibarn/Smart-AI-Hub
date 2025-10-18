import { Document, AccessLevel, User, Organization, Agency } from '@/types';

export class AccessControlService {
  /**
   * Check if user has access to a document
   */
  async checkDocumentAccess(userId: string, document: Document): Promise<boolean> {
    try {
      // Document owner always has access
      if (document.userId === userId) {
        return true;
      }

      // Get user context
      const userContext = await this.getUserContext(userId);
      if (!userContext) {
        return false;
      }

      // Check access based on document's access level
      switch (document.accessLevel) {
        case AccessLevel.PRIVATE:
          // Only owner has access
          return false;

        case AccessLevel.AGENT:
          // Check if user's agent is in the shared list
          return this.checkAgentAccess(userContext, document.sharedWithAgentIds);

        case AccessLevel.AGENCY:
          // Check if user is in the same agency
          return this.checkAgencyAccess(userContext, document);

        case AccessLevel.ORGANIZATION:
          // Check if user is in the same organization
          return this.checkOrganizationAccess(userContext, document);

        case AccessLevel.PUBLIC:
          // Everyone has access
          return true;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking document access:', error);
      return false;
    }
  }

  /**
   * Build access filter for vector search
   */
  async buildAccessFilter(userId: string, agentId?: string): Promise<Record<string, any>> {
    try {
      const userContext = await this.getUserContext(userId);
      if (!userContext) {
        return { userId }; // Fallback to user-only access
      }

      const filters: Record<string, any> = {};

      // Always include user's own documents
      filters.userId = userId;

      // Include agent-specific documents if agent ID is provided
      if (agentId) {
        filters.agentId = agentId;
        filters.accessLevel = {
          $in: [
            AccessLevel.PRIVATE,
            AccessLevel.AGENT,
            AccessLevel.AGENCY,
            AccessLevel.ORGANIZATION,
            AccessLevel.PUBLIC,
          ],
        };
      } else {
        filters.accessLevel = {
          $in: [
            AccessLevel.PRIVATE,
            AccessLevel.AGENCY,
            AccessLevel.ORGANIZATION,
            AccessLevel.PUBLIC,
          ],
        };
      }

      // Include agency documents
      if (userContext.agency) {
        filters.$or = [
          { userId },
          { agencyId: userContext.agency.id, accessLevel: AccessLevel.AGENCY },
          { organizationId: userContext.organization?.id, accessLevel: AccessLevel.ORGANIZATION },
          { accessLevel: AccessLevel.PUBLIC },
        ];
      } else if (userContext.organization) {
        filters.$or = [
          { userId },
          { organizationId: userContext.organization.id, accessLevel: AccessLevel.ORGANIZATION },
          { accessLevel: AccessLevel.PUBLIC },
        ];
      } else {
        filters.$or = [{ userId }, { accessLevel: AccessLevel.PUBLIC }];
      }

      return filters;
    } catch (error) {
      console.error('Error building access filter:', error);
      return { userId }; // Fallback to user-only access
    }
  }

  /**
   * Get accessible documents for a user
   */
  async getAccessibleDocuments(userId: string, agentId?: string): Promise<string[]> {
    try {
      const userContext = await this.getUserContext(userId);
      if (!userContext) {
        return [];
      }

      const accessibleDocumentIds: string[] = [];

      // Get user's own documents
      const userDocuments = await this.getUserDocuments(userId);
      accessibleDocumentIds.push(...userDocuments);

      // Get agent-specific documents if agent ID is provided
      if (agentId) {
        const agentDocuments = await this.getAgentDocuments(agentId);
        accessibleDocumentIds.push(...agentDocuments);
      }

      // Get agency documents
      if (userContext.agency) {
        const agencyDocuments = await this.getAgencyDocuments(userContext.agency.id);
        accessibleDocumentIds.push(...agencyDocuments);
      }

      // Get organization documents
      if (userContext.organization) {
        const orgDocuments = await this.getOrganizationDocuments(userContext.organization.id);
        accessibleDocumentIds.push(...orgDocuments);
      }

      // Get public documents
      const publicDocuments = await this.getPublicDocuments();
      accessibleDocumentIds.push(...publicDocuments);

      // Remove duplicates
      return [...new Set(accessibleDocumentIds)];
    } catch (error) {
      console.error('Error getting accessible documents:', error);
      return [];
    }
  }

  /**
   * Check if user can share documents at a specific level
   */
  async canShareAtLevel(userId: string, accessLevel: AccessLevel): Promise<boolean> {
    try {
      const userContext = await this.getUserContext(userId);
      if (!userContext) {
        return false;
      }

      switch (accessLevel) {
        case AccessLevel.PRIVATE:
        case AccessLevel.AGENT:
          // All users can share at these levels
          return true;

        case AccessLevel.AGENCY:
          // User must be in an agency
          return !!userContext.agency;

        case AccessLevel.ORGANIZATION:
          // User must be in an organization
          return !!userContext.organization;

        case AccessLevel.PUBLIC:
          // Only admins or organization owners can make documents public
          return await this.checkAdminOrOwnerAccess(userId, userContext);

        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking share permissions:', error);
      return false;
    }
  }

  /**
   * Filter documents based on access level
   */
  async filterDocumentsByAccess(userId: string, documents: Document[]): Promise<Document[]> {
    try {
      const accessibleDocuments: Document[] = [];

      for (const document of documents) {
        const hasAccess = await this.checkDocumentAccess(userId, document);
        if (hasAccess) {
          accessibleDocuments.push(document);
        }
      }

      return accessibleDocuments;
    } catch (error) {
      console.error('Error filtering documents by access:', error);
      return [];
    }
  }

  // Private helper methods

  private async getUserContext(userId: string): Promise<{
    user: User;
    organization?: Organization;
    agency?: Agency;
  } | null> {
    try {
      // Implementation would query the database
      // This is a placeholder implementation
      const user = await this.getUserById(userId);
      if (!user) {
        return null;
      }

      const organization = user.organizationId
        ? await this.getOrganizationById(user.organizationId)
        : undefined;

      const agency = user.agencyId ? await this.getAgencyById(user.agencyId) : undefined;

      return {
        user,
        organization: organization || undefined,
        agency: agency || undefined,
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return null;
    }
  }

  private checkAgentAccess(
    userContext: { user: User; organization?: Organization; agency?: Agency },
    sharedWithAgentIds: string[]
  ): boolean {
    // Implementation would check if user's agent is in the shared list
    return sharedWithAgentIds.length > 0; // Placeholder
  }

  private checkAgencyAccess(
    userContext: { user: User; organization?: Organization; agency?: Agency },
    document: Document
  ): boolean {
    if (!userContext.agency || !document.agencyId) {
      return false;
    }
    return userContext.agency.id === document.agencyId;
  }

  private checkOrganizationAccess(
    userContext: { user: User; organization?: Organization; agency?: Agency },
    document: Document
  ): boolean {
    if (!userContext.organization || !document.organizationId) {
      return false;
    }
    return userContext.organization.id === document.organizationId;
  }

  private async checkAdminOrOwnerAccess(
    userId: string,
    userContext: { user: User; organization?: Organization; agency?: Agency }
  ): Promise<boolean> {
    // Implementation would check if user is admin or organization owner
    return userContext.user.role === 'admin'; // Placeholder
  }

  // Database access methods (placeholders)

  private async getUserById(userId: string): Promise<User | null> {
    // Implementation would query from database
    return null;
  }

  private async getOrganizationById(organizationId: string): Promise<Organization | null> {
    // Implementation would query from database
    return null;
  }

  private async getAgencyById(agencyId: string): Promise<Agency | null> {
    // Implementation would query from database
    return null;
  }

  private async getUserDocuments(userId: string): Promise<string[]> {
    // Implementation would query from database
    return [];
  }

  private async getAgentDocuments(agentId: string): Promise<string[]> {
    // Implementation would query from database
    return [];
  }

  private async getAgencyDocuments(agencyId: string): Promise<string[]> {
    // Implementation would query from database
    return [];
  }

  private async getOrganizationDocuments(organizationId: string): Promise<string[]> {
    // Implementation would query from database
    return [];
  }

  private async getPublicDocuments(): Promise<string[]> {
    // Implementation would query from database
    return [];
  }
}
