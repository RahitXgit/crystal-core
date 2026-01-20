/**
 * Sheets Data Adapter
 * 
 * Implements DataService interface using Google Sheets as storage.
 * Maps sheet rows to typed objects.
 */

import { getSheetsClient } from '../sheets/client'
import { SHEETS_CONFIG } from '../sheets/config'
import { generateId, now, parseBoolean, safeJsonParse } from '../utils'
import type {
    DataService,
    User,
    Role,
    RoleAssignment,
    Module,
    Permission,
    SiteConfig,
    TransactionLog,
    SystemLog,
} from './types'

const sheets = getSheetsClient()

// ============================================================================
// ROW MAPPERS
// ============================================================================

function mapRowToUser(row: any[]): User {
    return {
        user_id: row[0],
        email: row[1],
        name: row[2],
        auth_provider: row[3] as 'google' | 'email' | 'sso',
        is_active: parseBoolean(row[4]),
        created_at: row[5],
        updated_at: row[6],
        last_login_at: row[7] || undefined,
        metadata: row[8] || undefined,
    }
}

function mapRowToRole(row: any[]): Role {
    return {
        role_id: row[0],
        role_code: row[1],
        role_name: row[2],
        description: row[3],
        is_active: parseBoolean(row[4]),
        created_at: row[5],
        updated_at: row[6],
    }
}

function mapRowToRoleAssignment(row: any[]): RoleAssignment {
    return {
        assignment_id: row[0],
        user_id: row[1],
        role_id: row[2],
        site_code: row[3] || undefined,
        assigned_by: row[4],
        assigned_at: row[5],
        expires_at: row[6] || undefined,
        is_active: parseBoolean(row[7]),
    }
}

function mapRowToModule(row: any[]): Module {
    return {
        module_id: row[0],
        module_code: row[1],
        module_name: row[2],
        description: row[3],
        icon: row[4],
        route: row[5],
        is_active: parseBoolean(row[6]),
        sort_order: parseInt(row[7]) || 0,
        created_at: row[8],
        updated_at: row[9],
    }
}

function mapRowToPermission(row: any[]): Permission {
    return {
        permission_id: row[0],
        role_id: row[1],
        module_code: row[2],
        action: row[3],
        resource: row[4],
        conditions: row[5] || undefined,
        is_active: parseBoolean(row[6]),
        created_at: row[7],
        updated_at: row[8],
    }
}

function mapRowToSiteConfig(row: any[]): SiteConfig {
    return {
        config_id: row[0],
        site_code: row[1],
        config_key: row[2],
        config_value: row[3],
        data_type: row[4] as 'string' | 'number' | 'boolean' | 'json',
        description: row[5],
        is_active: parseBoolean(row[6]),
        created_at: row[7],
        updated_at: row[8],
    }
}

function mapRowToTransactionLog(row: any[]): TransactionLog {
    return {
        tx_id: row[0],
        user_id: row[1],
        module_code: row[2],
        action: row[3],
        entity_type: row[4],
        entity_id: row[5] || undefined,
        status: row[6] as 'PENDING' | 'SUCCESS' | 'FAILED',
        payload: row[7] || undefined,
        error_message: row[8] || undefined,
        started_at: row[9],
        completed_at: row[10] || undefined,
        duration_ms: row[11] ? parseInt(row[11]) : undefined,
    }
}

// ============================================================================
// SHEETS DATA ADAPTER
// ============================================================================

export const sheetsAdapter: DataService = {
    // ==========================================================================
    // USERS
    // ==========================================================================

    async getUsers(): Promise<User[]> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.USERS)
        // Skip header row
        return rows.slice(1).map(mapRowToUser)
    },

    async getUserById(userId: string): Promise<User | null> {
        const users = await this.getUsers()
        return users.find(u => u.user_id === userId) || null
    },

    async getUserByEmail(email: string): Promise<User | null> {
        const users = await this.getUsers()
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
    },

    async createUser(user: Omit<User, 'created_at' | 'updated_at'> & Partial<Pick<User, 'user_id'>>): Promise<User> {
        const newUser: User = {
            ...user,
            user_id: user.user_id || generateId(), // Use provided ID or generate new one
            created_at: now(),
            updated_at: now(),
        }

        const row = [
            newUser.user_id,
            newUser.email,
            newUser.name,
            newUser.auth_provider,
            newUser.is_active ? 'TRUE' : 'FALSE',
            newUser.created_at,
            newUser.updated_at,
            newUser.last_login_at || '',
            newUser.metadata || '',
        ]

        await sheets.append(SHEETS_CONFIG.sheets.USERS, [row])
        return newUser
    },

    async updateUser(userId: string, updates: Partial<User>): Promise<User> {
        const users = await this.getUsers()
        const index = users.findIndex(u => u.user_id === userId)

        if (index === -1) {
            throw new Error(`User not found: ${userId}`)
        }

        const updatedUser = {
            ...users[index],
            ...updates,
            updated_at: now(),
        }

        const row = [
            updatedUser.user_id,
            updatedUser.email,
            updatedUser.name,
            updatedUser.auth_provider,
            updatedUser.is_active ? 'TRUE' : 'FALSE',
            updatedUser.created_at,
            updatedUser.updated_at,
            updatedUser.last_login_at || '',
            updatedUser.metadata || '',
        ]

        // Row index + 2 (1 for header, 1 for 1-indexed)
        const rowNumber = index + 2
        await sheets.write(SHEETS_CONFIG.sheets.USERS, `A${rowNumber}:I${rowNumber}`, [row])

        return updatedUser
    },

    // ==========================================================================
    // ROLES
    // ==========================================================================

    async getRoles(): Promise<Role[]> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.ROLES)
        return rows.slice(1).map(mapRowToRole)
    },

    async getRoleById(roleId: string): Promise<Role | null> {
        const roles = await this.getRoles()
        return roles.find(r => r.role_id === roleId) || null
    },

    async getRoleByCode(roleCode: string): Promise<Role | null> {
        const roles = await this.getRoles()
        return roles.find(r => r.role_code === roleCode) || null
    },

    // ==========================================================================
    // ROLE ASSIGNMENTS
    // ==========================================================================

    async getRoleAssignments(userId: string): Promise<RoleAssignment[]> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.ROLE_ASSIGNMENTS)
        const assignments = rows.slice(1).map(mapRowToRoleAssignment)
        return assignments.filter(a => a.user_id === userId && a.is_active)
    },

    async assignRole(
        assignment: Omit<RoleAssignment, 'assignment_id' | 'assigned_at'>
    ): Promise<RoleAssignment> {
        const newAssignment: RoleAssignment = {
            ...assignment,
            assignment_id: generateId(),
            assigned_at: now(),
        }

        const row = [
            newAssignment.assignment_id,
            newAssignment.user_id,
            newAssignment.role_id,
            newAssignment.site_code || '',
            newAssignment.assigned_by,
            newAssignment.assigned_at,
            newAssignment.expires_at || '',
            newAssignment.is_active ? 'TRUE' : 'FALSE',
        ]

        await sheets.append(SHEETS_CONFIG.sheets.ROLE_ASSIGNMENTS, [row])
        return newAssignment
    },

    async revokeRole(assignmentId: string): Promise<void> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.ROLE_ASSIGNMENTS)
        const assignments = rows.slice(1).map(mapRowToRoleAssignment)
        const index = assignments.findIndex(a => a.assignment_id === assignmentId)

        if (index === -1) {
            throw new Error(`Assignment not found: ${assignmentId}`)
        }

        const assignment = assignments[index]
        assignment.is_active = false

        const row = [
            assignment.assignment_id,
            assignment.user_id,
            assignment.role_id,
            assignment.site_code || '',
            assignment.assigned_by,
            assignment.assigned_at,
            assignment.expires_at || '',
            'FALSE',
        ]

        const rowNumber = index + 2
        await sheets.write(SHEETS_CONFIG.sheets.ROLE_ASSIGNMENTS, `A${rowNumber}:H${rowNumber}`, [row])
    },

    // ==========================================================================
    // MODULES
    // ==========================================================================

    async getModules(): Promise<Module[]> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.MODULES)
        return rows.slice(1).map(mapRowToModule)
    },

    async getActiveModules(): Promise<Module[]> {
        const modules = await this.getModules()
        return modules
            .filter(m => m.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
    },

    // ==========================================================================
    // PERMISSIONS
    // ==========================================================================

    async getPermissions(roleId: string): Promise<Permission[]> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.PERMISSIONS)
        const permissions = rows.slice(1).map(mapRowToPermission)
        return permissions.filter(p => p.role_id === roleId && p.is_active)
    },

    async getAllPermissions(): Promise<Permission[]> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.PERMISSIONS)
        return rows.slice(1).map(mapRowToPermission).filter(p => p.is_active)
    },

    // ==========================================================================
    // SITE CONFIG
    // ==========================================================================

    async getSiteConfig(siteCode: string): Promise<SiteConfig[]> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.SITE_CONFIG)
        const configs = rows.slice(1).map(mapRowToSiteConfig)
        return configs.filter(c => c.site_code === siteCode && c.is_active)
    },

    async getConfigValue(siteCode: string, key: string): Promise<string | null> {
        const configs = await this.getSiteConfig(siteCode)
        const config = configs.find(c => c.config_key === key)
        return config?.config_value || null
    },

    // ==========================================================================
    // TRANSACTION LOG
    // ==========================================================================

    async createTransactionLog(
        log: Omit<TransactionLog, 'tx_id' | 'started_at'>
    ): Promise<TransactionLog> {
        const newLog: TransactionLog = {
            ...log,
            tx_id: generateId(),
            started_at: now(),
        }

        const row = [
            newLog.tx_id,
            newLog.user_id,
            newLog.module_code,
            newLog.action,
            newLog.entity_type,
            newLog.entity_id || '',
            newLog.status,
            newLog.payload || '',
            newLog.error_message || '',
            newLog.started_at,
            newLog.completed_at || '',
            newLog.duration_ms?.toString() || '',
        ]

        await sheets.append(SHEETS_CONFIG.sheets.TRANSACTION_LOG, [row])
        return newLog
    },

    async updateTransactionLog(txId: string, updates: Partial<TransactionLog>): Promise<void> {
        const rows = await sheets.read(SHEETS_CONFIG.sheets.TRANSACTION_LOG)
        const logs = rows.slice(1).map(mapRowToTransactionLog)
        const index = logs.findIndex(l => l.tx_id === txId)

        if (index === -1) {
            throw new Error(`Transaction log not found: ${txId}`)
        }

        const updatedLog = { ...logs[index], ...updates }

        const row = [
            updatedLog.tx_id,
            updatedLog.user_id,
            updatedLog.module_code,
            updatedLog.action,
            updatedLog.entity_type,
            updatedLog.entity_id || '',
            updatedLog.status,
            updatedLog.payload || '',
            updatedLog.error_message || '',
            updatedLog.started_at,
            updatedLog.completed_at || '',
            updatedLog.duration_ms?.toString() || '',
        ]

        const rowNumber = index + 2
        await sheets.write(SHEETS_CONFIG.sheets.TRANSACTION_LOG, `A${rowNumber}:L${rowNumber}`, [row])
    },

    // ==========================================================================
    // SYSTEM LOG
    // ==========================================================================

    async createSystemLog(log: Omit<SystemLog, 'log_id' | 'timestamp'>): Promise<void> {
        const newLog: SystemLog = {
            ...log,
            log_id: generateId(),
            timestamp: now(),
        }

        const row = [
            newLog.log_id,
            newLog.timestamp,
            newLog.level,
            newLog.user_id || '',
            newLog.module_code || '',
            newLog.action || '',
            newLog.message,
            newLog.details || '',
            newLog.correlation_id || '',
            newLog.ip_address || '',
            newLog.user_agent || '',
        ]

        await sheets.append(SHEETS_CONFIG.sheets.SYSTEM_LOG, [row])
    },
}
