// Using mock checkUserVisibility from setup.ts

describe('Visibility Rules', () => {
  let admin: any;
  let agency1: any, agency2: any;
  let org1: any, org2: any;
  let orgAdmin1: any, orgAdmin2: any;
  let general1: any, general2: any;

  beforeAll(async () => {
    // Create test hierarchy
    admin = await (global as any).createUser({ tier: 'administrator' });

    agency1 = await (global as any).createUser({ tier: 'agency' });
    agency2 = await (global as any).createUser({ tier: 'agency' });

    org1 = await (global as any).createUser({ tier: 'organization', parentAgencyId: agency1.id });
    org2 = await (global as any).createUser({ tier: 'organization', parentAgencyId: agency2.id });

    orgAdmin1 = await (global as any).createUser({ tier: 'admin', parentOrganizationId: org1.id });
    orgAdmin2 = await (global as any).createUser({ tier: 'admin', parentOrganizationId: org2.id });

    general1 = await (global as any).createUser({ tier: 'general', parentOrganizationId: org1.id });
    general2 = await (global as any).createUser({ tier: 'general', parentOrganizationId: org2.id });
  });

  afterAll(async () => {
    // Clean up
    await (global as any).cleanupTestUsers();
  });

  describe('Administrator Visibility', () => {
    it('should see all users', async () => {
      const canSeeAgency1 = await (global as any).checkUserVisibility(admin.id, agency1.id);
      const canSeeOrg1 = await (global as any).checkUserVisibility(admin.id, org1.id);
      const canSeeGeneral1 = await (global as any).checkUserVisibility(admin.id, general1.id);

      expect(canSeeAgency1).toBe(true);
      expect(canSeeOrg1).toBe(true);
      expect(canSeeGeneral1).toBe(true);
    });
  });

  describe('Agency Visibility', () => {
    it('should see organizations under them', async () => {
      const canSeeOrg1 = await (global as any).checkUserVisibility(agency1.id, org1.id);
      expect(canSeeOrg1).toBe(true);
    });

    it('should see admins in their organizations', async () => {
      const canSeeAdmin1 = await (global as any).checkUserVisibility(agency1.id, orgAdmin1.id);
      expect(canSeeAdmin1).toBe(true);
    });

    it('should see generals under them', async () => {
      const canSeeGeneral1 = await (global as any).checkUserVisibility(agency1.id, general1.id);
      expect(canSeeGeneral1).toBe(true);
    });

    it('should NOT see other agencies', async () => {
      const canSeeAgency2 = await (global as any).checkUserVisibility(agency1.id, agency2.id);
      expect(canSeeAgency2).toBe(false);
    });

    it('should NOT see organizations of other agencies', async () => {
      const canSeeOrg2 = await (global as any).checkUserVisibility(agency1.id, org2.id);
      expect(canSeeOrg2).toBe(false);
    });

    it('should NOT see admins of other agencies', async () => {
      const canSeeAdmin2 = await (global as any).checkUserVisibility(agency1.id, orgAdmin2.id);
      expect(canSeeAdmin2).toBe(false);
    });
  });

  describe('Organization Visibility', () => {
    it('should see admins in their organization', async () => {
      const canSeeAdmin1 = await (global as any).checkUserVisibility(org1.id, orgAdmin1.id);
      expect(canSeeAdmin1).toBe(true);
    });

    it('should see generals in their organization', async () => {
      const canSeeGeneral1 = await (global as any).checkUserVisibility(org1.id, general1.id);
      expect(canSeeGeneral1).toBe(true);
    });

    it('should NOT see other organizations', async () => {
      const canSeeOrg2 = await (global as any).checkUserVisibility(org1.id, org2.id);
      expect(canSeeOrg2).toBe(false);
    });

    it('should NOT see admins of other organizations', async () => {
      const canSeeAdmin2 = await (global as any).checkUserVisibility(org1.id, orgAdmin2.id);
      expect(canSeeAdmin2).toBe(false);
    });

    it('should NOT see generals of other organizations', async () => {
      const canSeeGeneral2 = await (global as any).checkUserVisibility(org1.id, general2.id);
      expect(canSeeGeneral2).toBe(false);
    });
  });

  describe('Admin Visibility', () => {
    it('should see generals in same organization', async () => {
      const canSeeGeneral1 = await (global as any).checkUserVisibility(orgAdmin1.id, general1.id);
      expect(canSeeGeneral1).toBe(true);
    });

    it('should see other admins in same organization', async () => {
      const admin2 = await (global as any).createUser({
        tier: 'admin',
        parentOrganizationId: org1.id,
      });
      const canSeeAdmin2 = await (global as any).checkUserVisibility(orgAdmin1.id, admin2.id);
      expect(canSeeAdmin2).toBe(true);
    });

    it('should NOT see generals of other organizations', async () => {
      const canSeeGeneral2 = await (global as any).checkUserVisibility(orgAdmin1.id, general2.id);
      expect(canSeeGeneral2).toBe(false);
    });

    it('should NOT see admins of other organizations', async () => {
      const canSeeAdmin2 = await (global as any).checkUserVisibility(orgAdmin1.id, orgAdmin2.id);
      expect(canSeeAdmin2).toBe(false);
    });
  });

  describe('General Visibility', () => {
    it('should see only themselves', async () => {
      const canSeeThemselves = await (global as any).checkUserVisibility(general1.id, general1.id);
      expect(canSeeThemselves).toBe(true);
    });

    it('should NOT see other generals', async () => {
      const canSeeGeneral2 = await (global as any).checkUserVisibility(general1.id, general2.id);
      expect(canSeeGeneral2).toBe(false);
    });

    it('should NOT see admins', async () => {
      const canSeeAdmin = await (global as any).checkUserVisibility(general1.id, orgAdmin1.id);
      expect(canSeeAdmin).toBe(false);
    });

    it('should NOT see organizations', async () => {
      const canSeeOrg = await (global as any).checkUserVisibility(general1.id, org1.id);
      expect(canSeeOrg).toBe(false);
    });
  });
});

// Helper functions are now defined in setup.ts and available globally
