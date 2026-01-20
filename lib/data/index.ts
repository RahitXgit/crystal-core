/**
 * Data Service Interface
 * 
 * This is the main data access layer for the application.
 * Currently uses Sheets adapter, but can be swapped for DB adapter later.
 */

import { sheetsAdapter } from './sheets'
import type { DataService } from './types'

// Export the current data service implementation
export const dataService: DataService = sheetsAdapter

// When migrating to database, simply change this line:
// import { dbAdapter } from './db'
// export const dataService: DataService = dbAdapter

// Export types for convenience
export type * from './types'
