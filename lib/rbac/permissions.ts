/**
 * RBAC Permission Resolver
 * 
 * Features:
 * - Resolve user permissions from roles
 * - Permission caching (5-minute TTL)
 * - Fail closed (deny access on error)
 */

import { dataService } from '../data'
import type { UserPermission, UserRole } from './types'
import { safeJsonParse } from '../utils'

// ============================================================================
// PERMISSION CACHE
// ============================================================================

interface CacheEntry {
    permissions: UserPermission[]
    expiresAt: number
}

const permissionCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedPermissions(userId: string): UserPermission[] | null {
    const entry = permissionCache.get(userId)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
        permissionCache.delete(userId)
        return null
    }

    return entry.permissions
}

function setCachedPermissions(userId: string, permissions: UserPermission[]): void {
    permissionCache.set(userId, {
        permissions,
        expiresAt: Date.now() + CACHE_TTL,
    })
}

export function invalidatePermissionCache(userId?: string): void {
    if (userId) {
        permissionCache.delete(userId)
    } else {
        permissionCache.clear()
    }
}

// ============================================================================
// PERMISSION RESOLUTION
// ============================================================================

/**
 * Get all roles assigned to a user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
    try {
        console.log('[RBAC] Fetching roles for user:', userId)
        const assignments = await dataService.getRoleAssignments(userId)
        console.log('[RBAC] Role assignments:', assignments)
        const roles: UserRole[] = []

        for (const assignment of assignments) {
            const role = await dataService.getRoleById(assignment.role_id)
            console.log('[RBAC] Fetched role:', role)
            if (role && role.is_active) {
                roles.push({
                    role_id: role.role_id,
                    role_code: role.role_code,
                    role_name: role.role_name,
                    site_code: assignment.site_code,
                })
            }
        }

        console.log('[RBAC] Final roles:', roles)
        return roles
    } catch (error) {
        console.error('Error fetching user roles:', error)
        return [] // Fail closed
    }
}

/**
 * Get all permissions for a user (from all assigned roles)
 */
export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
    // Check cache first
    const cached = getCachedPermissions(userId)
    if (cached) {
        return cached
    }

    try {
        const roles = await getUserRoles(userId)
        const allPermissions: UserPermission[] = []

        for (const role of roles) {
            const permissions = await dataService.getPermissions(role.role_id)

            for (const perm of permissions) {
                allPermissions.push({
                    module_code: perm.module_code,
                    action: perm.action,
                    resource: perm.resource,
                    conditions: safeJsonParse(perm.conditions, {}),
                })
            }
        }

        // Cache the result
        setCachedPermissions(userId, allPermissions)

        return allPermissions
    } catch (error) {
        console.error('Error fetching user permissions:', error)
        return [] // Fail closed
    }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
    userId: string,
    moduleCode: string,
    action: string,
    resource?: string
): Promise<boolean> {
    try {
        const permissions = await getUserPermissions(userId)

        return permissions.some(perm => {
            // Check module
            if (perm.module_code !== '*' && perm.module_code !== moduleCode) {
                return false
            }

            // Check action
            if (perm.action !== '*' && perm.action !== action) {
                return false
            }

            // Check resource (if specified)
            if (resource && perm.resource !== '*' && perm.resource !== resource) {
                return false
            }

            return true
        })
    } catch (error) {
        console.error('Error checking permission:', error)
        return false // Fail closed
    }
}

/**
 * Check if user can access a module
 */
export async function canAccessModule(
    userId: string,
    moduleCode: string
): Promise<boolean> {
    try {
        const permissions = await getUserPermissions(userId)
        return permissions.some(perm =>
            perm.module_code === '*' || perm.module_code === moduleCode
        )
    } catch (error) {
        console.error('Error checking module access:', error)
        return false // Fail closed
    }
}

/**
 * Get all modules a user can access
 */
export async function getUserModules(userId: string): Promise<string[]> {
    try {
        const permissions = await getUserPermissions(userId)
        const moduleCodes = new Set<string>()

        for (const perm of permissions) {
            if (perm.module_code === '*') {
                // User has access to all modules
                const allModules = await dataService.getActiveModules()
                return allModules.map(m => m.module_code)
            }
            moduleCodes.add(perm.module_code)
        }

        return Array.from(moduleCodes)
    } catch (error) {
        console.error('Error fetching user modules:', error)
        return [] // Fail closed
    }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, roleCode: string): Promise<boolean> {
    try {
        const roles = await getUserRoles(userId)
        return roles.some(r => r.role_code === roleCode)
    } catch (error) {
        console.error('Error checking role:', error)
        return false // Fail closed
    }
}

/**
 * Check if user is admin (has ADMIN or SUPER_ADMIN role)
 */
export async function isAdmin(userId: string): Promise<boolean> {
    return (
        (await hasRole(userId, 'SUPER_ADMIN')) ||
        (await hasRole(userId, 'ADMIN'))
    )
}
