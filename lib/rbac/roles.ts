/**
 * RBAC Role Management
 */

import { dataService } from '../data'
import { invalidatePermissionCache } from './permissions'
import type { UserRole } from './types'

/**
 * Assign a role to a user
 */
export async function assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    siteCode?: string,
    expiresAt?: string
): Promise<void> {
    await dataService.assignRole({
        user_id: userId,
        role_id: roleId,
        site_code: siteCode,
        assigned_by: assignedBy,
        expires_at: expiresAt,
        is_active: true,
    })

    // Invalidate permission cache
    invalidatePermissionCache(userId)
}

/**
 * Revoke a role from a user
 */
export async function revokeRole(assignmentId: string, userId: string): Promise<void> {
    await dataService.revokeRole(assignmentId)

    // Invalidate permission cache
    invalidatePermissionCache(userId)
}

// Re-export getUserRoles from permissions
export { getUserRoles } from './permissions'
