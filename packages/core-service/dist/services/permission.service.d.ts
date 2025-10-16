export interface Role {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
    createdAt: Date;
}
/**
 * Check if a user has a specific permission
 * Caches result in Redis for 1 hour TTL
 */
export declare const hasPermission: (userId: string, resource: string, action: string) => Promise<boolean>;
/**
 * Get all roles for a user
 */
export declare const getUserRoles: (userId: string) => Promise<Role[]>;
/**
 * Get all permissions for a user
 */
export declare const getUserPermissions: (userId: string) => Promise<Permission[]>;
/**
 * Assign a role to a user
 */
export declare const assignRole: (userId: string, roleId: string, assignedBy?: string) => Promise<void>;
/**
 * Remove a role from a user
 */
export declare const removeRole: (userId: string, roleId: string) => Promise<void>;
/**
 * Get all available roles
 */
export declare const getAllRoles: () => Promise<Role[]>;
/**
 * Get all available permissions
 */
export declare const getAllPermissions: () => Promise<Permission[]>;
/**
 * Create a new role
 */
export declare const createRole: (name: string, description?: string, permissionIds?: string[]) => Promise<Role>;
/**
 * Clear permission cache for a user
 * Useful when roles or permissions are changed
 */
export declare const clearUserPermissionCache: (userId: string) => Promise<void>;
/**
 * Disconnect Redis client (call this when shutting down the application)
 */
export declare const disconnectRedis: () => Promise<void>;
//# sourceMappingURL=permission.service.d.ts.map