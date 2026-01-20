/**
 * CRYSTAL CORE — SCHEMA SETUP SCRIPT
 * 
 * Purpose: Initialize core platform tables in Google Sheets
 * Scope: Auth, RBAC, Logging, Configuration (NO module tables)
 * 
 * Usage:
 * 1. Open Google Sheets
 * 2. Extensions → Apps Script
 * 3. Paste this code
 * 4. Run: setupCrystalCoreSchema()
 * 
 * Safe to re-run (idempotent)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCHEMA_VERSION = '1.0.0'
const CREATED_BY = 'Crystal Core Setup Script'

// ============================================================================
// MAIN SETUP FUNCTION
// ============================================================================

function setupCrystalCoreSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  
  Logger.log('🚀 Starting Crystal Core Schema Setup...')
  Logger.log(`📊 Spreadsheet: ${ss.getName()}`)
  
  try {
    // Core tables (order matters for dependencies)
    createUsersTable(ss)
    createRolesTable(ss)
    createRoleAssignmentsTable(ss)
    createModulesTable(ss)
    createPermissionsTable(ss)
    createSiteConfigTable(ss)
    createTransactionLogTable(ss)
    createSystemLogTable(ss)
    createSessionCacheTable(ss)
    
    // Seed initial data
    seedInitialData(ss)
    
    // Create metadata sheet
    createMetadataSheet(ss)
    
    Logger.log('✅ Crystal Core Schema Setup Complete!')
    Logger.log('📋 Review each sheet and adjust column widths as needed.')
    
    SpreadsheetApp.getUi().alert(
      'Success',
      'Crystal Core schema created successfully!\n\n' +
      'Next steps:\n' +
      '1. Review each sheet\n' +
      '2. Add your first user to USERS\n' +
      '3. Assign roles in ROLE_ASSIGNMENTS',
      SpreadsheetApp.getUi().ButtonSet.OK
    )
    
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`)
    SpreadsheetApp.getUi().alert(
      'Error',
      `Schema setup failed: ${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    )
  }
}

// ============================================================================
// TABLE CREATION FUNCTIONS
// ============================================================================

/**
 * USERS — Identity table
 * Purpose: Store user identity and basic profile
 */
function createUsersTable(ss) {
  const sheetName = 'USERS'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'user_id',          // UUID (primary key)
    'email',            // Unique email
    'name',             // Display name
    'auth_provider',    // google | email | sso
    'is_active',        // TRUE | FALSE
    'created_at',       // Timestamp
    'updated_at',       // Timestamp
    'last_login_at',    // Timestamp
    'metadata'          // JSON string (optional extra data)
  ]
  
  setupSheetHeaders(sheet, headers)
  
  // Data validation
  const lastRow = sheet.getMaxRows()
  
  // is_active: TRUE/FALSE dropdown
  const isActiveRange = sheet.getRange(2, 5, lastRow - 1, 1)
  const isActiveRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build()
  isActiveRange.setDataValidation(isActiveRule)
  
  // auth_provider: dropdown
  const authProviderRange = sheet.getRange(2, 4, lastRow - 1, 1)
  const authProviderRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['google', 'email', 'sso'], true)
    .setAllowInvalid(false)
    .build()
  authProviderRange.setDataValidation(authProviderRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * ROLES — Permission groups
 * Purpose: Define roles (e.g., ADMIN, HR_MANAGER, WMS_OPERATOR)
 */
function createRolesTable(ss) {
  const sheetName = 'ROLES'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'role_id',          // UUID (primary key)
    'role_code',        // Unique code (e.g., ADMIN, HR_MANAGER)
    'role_name',        // Display name
    'description',      // What this role does
    'is_active',        // TRUE | FALSE
    'created_at',       // Timestamp
    'updated_at'        // Timestamp
  ]
  
  setupSheetHeaders(sheet, headers)
  
  // Data validation
  const lastRow = sheet.getMaxRows()
  const isActiveRange = sheet.getRange(2, 5, lastRow - 1, 1)
  const isActiveRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build()
  isActiveRange.setDataValidation(isActiveRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * ROLE_ASSIGNMENTS — User ↔ Role mapping
 * Purpose: Assign roles to users
 */
function createRoleAssignmentsTable(ss) {
  const sheetName = 'ROLE_ASSIGNMENTS'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'assignment_id',    // UUID (primary key)
    'user_id',          // Foreign key → USERS
    'role_id',          // Foreign key → ROLES
    'site_code',        // Site scope (NULL = all sites)
    'assigned_by',      // user_id of assigner
    'assigned_at',      // Timestamp
    'expires_at',       // Timestamp (NULL = never expires)
    'is_active'         // TRUE | FALSE
  ]
  
  setupSheetHeaders(sheet, headers)
  
  const lastRow = sheet.getMaxRows()
  const isActiveRange = sheet.getRange(2, 8, lastRow - 1, 1)
  const isActiveRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build()
  isActiveRange.setDataValidation(isActiveRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * MODULES — Feature registry
 * Purpose: Define available modules (HR, WMS, Procurement, etc.)
 */
function createModulesTable(ss) {
  const sheetName = 'MODULES'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'module_id',        // UUID (primary key)
    'module_code',      // Unique code (e.g., HR, WMS, PROCUREMENT)
    'module_name',      // Display name
    'description',      // What this module does
    'icon',             // Icon name (for UI)
    'route',            // URL path (e.g., /modules/hr)
    'is_active',        // TRUE | FALSE
    'sort_order',       // Display order (1, 2, 3...)
    'created_at',       // Timestamp
    'updated_at'        // Timestamp
  ]
  
  setupSheetHeaders(sheet, headers)
  
  const lastRow = sheet.getMaxRows()
  const isActiveRange = sheet.getRange(2, 7, lastRow - 1, 1)
  const isActiveRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build()
  isActiveRange.setDataValidation(isActiveRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * PERMISSIONS — Role ↔ Module ↔ Action mapping
 * Purpose: Define what actions each role can perform in each module
 */
function createPermissionsTable(ss) {
  const sheetName = 'PERMISSIONS'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'permission_id',    // UUID (primary key)
    'role_id',          // Foreign key → ROLES
    'module_code',      // Module this permission applies to
    'action',           // Action code (e.g., create, read, update, delete, approve)
    'resource',         // Resource type (e.g., candidate, inbound, pr)
    'conditions',       // JSON string (e.g., {"site": "HQ", "status": "pending"})
    'is_active',        // TRUE | FALSE
    'created_at',       // Timestamp
    'updated_at'        // Timestamp
  ]
  
  setupSheetHeaders(sheet, headers)
  
  const lastRow = sheet.getMaxRows()
  const isActiveRange = sheet.getRange(2, 7, lastRow - 1, 1)
  const isActiveRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build()
  isActiveRange.setDataValidation(isActiveRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * SITE_CONFIG — Multi-site configuration
 * Purpose: Store site-specific settings
 */
function createSiteConfigTable(ss) {
  const sheetName = 'SITE_CONFIG'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'config_id',        // UUID (primary key)
    'site_code',        // Site identifier (e.g., HQ, WAREHOUSE_1)
    'config_key',       // Setting name (e.g., approval_threshold, currency)
    'config_value',     // Setting value (string, number, JSON)
    'data_type',        // string | number | boolean | json
    'description',      // What this setting does
    'is_active',        // TRUE | FALSE
    'created_at',       // Timestamp
    'updated_at'        // Timestamp
  ]
  
  setupSheetHeaders(sheet, headers)
  
  const lastRow = sheet.getMaxRows()
  
  // data_type dropdown
  const dataTypeRange = sheet.getRange(2, 5, lastRow - 1, 1)
  const dataTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['string', 'number', 'boolean', 'json'], true)
    .setAllowInvalid(false)
    .build()
  dataTypeRange.setDataValidation(dataTypeRule)
  
  // is_active dropdown
  const isActiveRange = sheet.getRange(2, 7, lastRow - 1, 1)
  const isActiveRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['TRUE', 'FALSE'], true)
    .setAllowInvalid(false)
    .build()
  isActiveRange.setDataValidation(isActiveRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * TRANSACTION_LOG — Intent logging (WAL pattern)
 * Purpose: Track all mutations for audit and recovery
 */
function createTransactionLogTable(ss) {
  const sheetName = 'TRANSACTION_LOG'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'tx_id',            // UUID (primary key, correlation ID)
    'user_id',          // Who initiated
    'module_code',      // Which module
    'action',           // What action (e.g., create_pr, approve_candidate)
    'entity_type',      // Resource type (e.g., pr, candidate, inbound)
    'entity_id',        // Resource ID (after creation)
    'status',           // PENDING | SUCCESS | FAILED
    'payload',          // JSON string (request data)
    'error_message',    // Error details (if FAILED)
    'started_at',       // Timestamp
    'completed_at',     // Timestamp
    'duration_ms'       // Execution time (milliseconds)
  ]
  
  setupSheetHeaders(sheet, headers)
  
  const lastRow = sheet.getMaxRows()
  const statusRange = sheet.getRange(2, 7, lastRow - 1, 1)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['PENDING', 'SUCCESS', 'FAILED'], true)
    .setAllowInvalid(false)
    .build()
  statusRange.setDataValidation(statusRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * SYSTEM_LOG — Error tracking and audit trail
 * Purpose: Log all system events (errors, warnings, info)
 */
function createSystemLogTable(ss) {
  const sheetName = 'SYSTEM_LOG'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'log_id',           // UUID (primary key)
    'timestamp',        // When
    'level',            // ERROR | WARN | INFO | DEBUG
    'user_id',          // Who (NULL for system events)
    'module_code',      // Which module
    'action',           // What action
    'message',          // Human-readable message
    'details',          // JSON string (stack trace, context)
    'correlation_id',   // Link to TRANSACTION_LOG.tx_id
    'ip_address',       // Client IP
    'user_agent'        // Client browser/app
  ]
  
  setupSheetHeaders(sheet, headers)
  
  const lastRow = sheet.getMaxRows()
  const levelRange = sheet.getRange(2, 3, lastRow - 1, 1)
  const levelRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ERROR', 'WARN', 'INFO', 'DEBUG'], true)
    .setAllowInvalid(false)
    .build()
  levelRange.setDataValidation(levelRule)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * SESSION_CACHE — Permission caching
 * Purpose: Cache user permissions to reduce Sheets reads
 */
function createSessionCacheTable(ss) {
  const sheetName = 'SESSION_CACHE'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = [
    'cache_key',        // Unique key (e.g., permissions:user_id)
    'cache_value',      // JSON string (cached data)
    'created_at',       // Timestamp
    'expires_at',       // Timestamp (TTL)
    'hit_count'         // How many times accessed
  ]
  
  setupSheetHeaders(sheet, headers)
  
  Logger.log(`✅ ${sheetName} created`)
}

/**
 * METADATA — Schema version and setup info
 * Purpose: Track schema version and setup history
 */
function createMetadataSheet(ss) {
  const sheetName = '_METADATA'
  Logger.log(`📝 Creating ${sheetName}...`)
  
  const sheet = getOrCreateSheet(ss, sheetName)
  
  const headers = ['Key', 'Value']
  setupSheetHeaders(sheet, headers)
  
  const metadata = [
    ['schema_version', SCHEMA_VERSION],
    ['created_at', new Date().toISOString()],
    ['created_by', CREATED_BY],
    ['last_updated', new Date().toISOString()],
    ['platform', 'Crystal Core'],
    ['environment', 'production']
  ]
  
  sheet.getRange(2, 1, metadata.length, 2).setValues(metadata)
  
  Logger.log(`✅ ${sheetName} created`)
}

// ============================================================================
// SEED DATA
// ============================================================================

function seedInitialData(ss) {
  Logger.log('🌱 Seeding initial data...')
  
  // Seed default roles
  seedDefaultRoles(ss)
  
  // Seed core modules
  seedCoreModules(ss)
  
  Logger.log('✅ Initial data seeded')
}

function seedDefaultRoles(ss) {
  const sheet = ss.getSheetByName('ROLES')
  
  const roles = [
    [
      Utilities.getUuid(),
      'SUPER_ADMIN',
      'Super Administrator',
      'Full system access, all modules, all sites',
      'TRUE',
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      Utilities.getUuid(),
      'ADMIN',
      'Administrator',
      'Site-level admin access',
      'TRUE',
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      Utilities.getUuid(),
      'VIEWER',
      'Viewer',
      'Read-only access to assigned modules',
      'TRUE',
      new Date().toISOString(),
      new Date().toISOString()
    ]
  ]
  
  sheet.getRange(2, 1, roles.length, 7).setValues(roles)
  Logger.log('  ✅ Default roles seeded')
}

function seedCoreModules(ss) {
  const sheet = ss.getSheetByName('MODULES')
  
  const modules = [
    [
      Utilities.getUuid(),
      'DASHBOARD',
      'Dashboard',
      'Main landing page and overview',
      'dashboard',
      '/dashboard',
      'TRUE',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ],
    [
      Utilities.getUuid(),
      'ADMIN',
      'Administration',
      'User management, roles, permissions',
      'settings',
      '/admin',
      'TRUE',
      99,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  ]
  
  sheet.getRange(2, 1, modules.length, 10).setValues(modules)
  Logger.log('  ✅ Core modules seeded')
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get existing sheet or create new one
 */
function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName)
  
  if (sheet) {
    Logger.log(`  ⚠️  Sheet "${sheetName}" already exists, clearing...`)
    sheet.clear()
  } else {
    sheet = ss.insertSheet(sheetName)
  }
  
  return sheet
}

/**
 * Setup sheet headers with formatting
 */
function setupSheetHeaders(sheet, headers) {
  const headerRange = sheet.getRange(1, 1, 1, headers.length)
  
  // Set header values
  headerRange.setValues([headers])
  
  // Format headers
  headerRange
    .setBackground('#4285F4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
  
  // Freeze header row
  sheet.setFrozenRows(1)
  
  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i)
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR TESTING
// ============================================================================

/**
 * Test function: Add sample user
 */
function addSampleUser() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName('USERS')
  
  const sampleUser = [
    Utilities.getUuid(),
    'admin@crystalcore.com',
    'System Administrator',
    'email',
    'TRUE',
    new Date().toISOString(),
    new Date().toISOString(),
    new Date().toISOString(),
    '{}'
  ]
  
  sheet.appendRow(sampleUser)
  Logger.log('✅ Sample user added')
}

/**
 * Test function: Clear all data (keep structure)
 */
function clearAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheets = [
    'USERS', 'ROLES', 'ROLE_ASSIGNMENTS', 'MODULES', 
    'PERMISSIONS', 'SITE_CONFIG', 'TRANSACTION_LOG', 
    'SYSTEM_LOG', 'SESSION_CACHE'
  ]
  
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName)
    if (sheet && sheet.getMaxRows() > 1) {
      sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns()).clear()
      Logger.log(`  ✅ Cleared ${sheetName}`)
    }
  })
  
  Logger.log('✅ All data cleared')
}
