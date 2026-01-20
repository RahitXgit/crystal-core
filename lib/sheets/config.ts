/**
 * Google Sheets Configuration
 */

export const SHEETS_CONFIG = {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,

    // Sheet names (must match schema-setup.gs)
    sheets: {
        USERS: 'USERS',
        ROLES: 'ROLES',
        ROLE_ASSIGNMENTS: 'ROLE_ASSIGNMENTS',
        MODULES: 'MODULES',
        PERMISSIONS: 'PERMISSIONS',
        SITE_CONFIG: 'SITE_CONFIG',
        TRANSACTION_LOG: 'TRANSACTION_LOG',
        SYSTEM_LOG: 'SYSTEM_LOG',
        SESSION_CACHE: 'SESSION_CACHE',
    },

    // Column mappings (0-indexed)
    columns: {
        USERS: {
            user_id: 0,
            email: 1,
            name: 2,
            auth_provider: 3,
            is_active: 4,
            created_at: 5,
            updated_at: 6,
            last_login_at: 7,
            metadata: 8,
        },
        ROLES: {
            role_id: 0,
            role_code: 1,
            role_name: 2,
            description: 3,
            is_active: 4,
            created_at: 5,
            updated_at: 6,
        },
        ROLE_ASSIGNMENTS: {
            assignment_id: 0,
            user_id: 1,
            role_id: 2,
            site_code: 3,
            assigned_by: 4,
            assigned_at: 5,
            expires_at: 6,
            is_active: 7,
        },
        MODULES: {
            module_id: 0,
            module_code: 1,
            module_name: 2,
            description: 3,
            icon: 4,
            route: 5,
            is_active: 6,
            sort_order: 7,
            created_at: 8,
            updated_at: 9,
        },
        PERMISSIONS: {
            permission_id: 0,
            role_id: 1,
            module_code: 2,
            action: 3,
            resource: 4,
            conditions: 5,
            is_active: 6,
            created_at: 7,
            updated_at: 8,
        },
        SITE_CONFIG: {
            config_id: 0,
            site_code: 1,
            config_key: 2,
            config_value: 3,
            data_type: 4,
            description: 5,
            is_active: 6,
            created_at: 7,
            updated_at: 8,
        },
        TRANSACTION_LOG: {
            tx_id: 0,
            user_id: 1,
            module_code: 2,
            action: 3,
            entity_type: 4,
            entity_id: 5,
            status: 6,
            payload: 7,
            error_message: 8,
            started_at: 9,
            completed_at: 10,
            duration_ms: 11,
        },
        SYSTEM_LOG: {
            log_id: 0,
            timestamp: 1,
            level: 2,
            user_id: 3,
            module_code: 4,
            action: 5,
            message: 6,
            details: 7,
            correlation_id: 8,
            ip_address: 9,
            user_agent: 10,
        },
    },
} as const

// Validate required environment variables
if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is required')
}
