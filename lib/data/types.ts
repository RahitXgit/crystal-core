/**
 * Data Layer Types
 * 
 * These types match the Google Sheets schema created by schema-setup.gs
 */

// ============================================================================
// USERS
// ============================================================================

export interface User {
    user_id: string
    email: string
    name: string
    auth_provider: 'google' | 'email' | 'sso'
    is_active: boolean
    created_at: string
    updated_at: string
    last_login_at?: string
    metadata?: string // JSON string
}

// ============================================================================
// ROLES
// ============================================================================

export interface Role {
    role_id: string
    role_code: string
    role_name: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
}

// ============================================================================
// ROLE_ASSIGNMENTS
// ============================================================================

export interface RoleAssignment {
    assignment_id: string
    user_id: string
    role_id: string
    site_code?: string
    assigned_by: string
    assigned_at: string
    expires_at?: string
    is_active: boolean
}

// ============================================================================
// MODULES
// ============================================================================

export interface Module {
    module_id: string
    module_code: string
    module_name: string
    description: string
    icon: string
    route: string
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export interface Permission {
    permission_id: string
    role_id: string
    module_code: string
    action: string
    resource: string
    conditions?: string // JSON string
    is_active: boolean
    created_at: string
    updated_at: string
}

// ============================================================================
// SITE_CONFIG
// ============================================================================

export interface SiteConfig {
    config_id: string
    site_code: string
    config_key: string
    config_value: string
    data_type: 'string' | 'number' | 'boolean' | 'json'
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
}

// ============================================================================
// TRANSACTION_LOG
// ============================================================================

export interface TransactionLog {
    tx_id: string
    user_id: string
    module_code: string
    action: string
    entity_type: string
    entity_id?: string
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    payload?: string // JSON string
    error_message?: string
    started_at: string
    completed_at?: string
    duration_ms?: number
}

// ============================================================================
// SYSTEM_LOG
// ============================================================================

export interface SystemLog {
    log_id: string
    timestamp: string
    level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'
    user_id?: string
    module_code?: string
    action?: string
    message: string
    details?: string // JSON string
    correlation_id?: string
    ip_address?: string
    user_agent?: string
}

// ============================================================================
// SESSION_CACHE
// ============================================================================

export interface SessionCache {
    cache_key: string
    cache_value: string // JSON string
    created_at: string
    expires_at: string
    hit_count: number
}

// ============================================================================
// DATA SERVICE INTERFACE
// ============================================================================

export interface DataService {
    // Users
    getUsers(): Promise<User[]>
    getUserById(userId: string): Promise<User | null>
    getUserByEmail(email: string): Promise<User | null>
    createUser(user: Omit<User, 'user_id' | 'created_at' | 'updated_at'>): Promise<User>
    updateUser(userId: string, updates: Partial<User>): Promise<User>

    // Roles
    getRoles(): Promise<Role[]>
    getRoleById(roleId: string): Promise<Role | null>
    getRoleByCode(roleCode: string): Promise<Role | null>

    // Role Assignments
    getRoleAssignments(userId: string): Promise<RoleAssignment[]>
    assignRole(assignment: Omit<RoleAssignment, 'assignment_id' | 'assigned_at'>): Promise<RoleAssignment>
    revokeRole(assignmentId: string): Promise<void>

    // Modules
    getModules(): Promise<Module[]>
    getActiveModules(): Promise<Module[]>

    // Permissions
    getPermissions(roleId: string): Promise<Permission[]>
    getAllPermissions(): Promise<Permission[]>

    // Site Config
    getSiteConfig(siteCode: string): Promise<SiteConfig[]>
    getConfigValue(siteCode: string, key: string): Promise<string | null>

    // Transaction Log
    createTransactionLog(log: Omit<TransactionLog, 'tx_id' | 'started_at'>): Promise<TransactionLog>
    updateTransactionLog(txId: string, updates: Partial<TransactionLog>): Promise<void>

    // System Log
    createSystemLog(log: Omit<SystemLog, 'log_id' | 'timestamp'>): Promise<void>
}
