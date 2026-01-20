/**
 * RBAC Types
 */

export interface UserPermission {
    module_code: string
    action: string
    resource: string
    conditions?: Record<string, any>
}

export interface UserRole {
    role_id: string
    role_code: string
    role_name: string
    site_code?: string
}

export interface PermissionCheck {
    userId: string
    moduleCode: string
    action: string
    resource?: string
    context?: Record<string, any>
}
