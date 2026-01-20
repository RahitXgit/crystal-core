/**
 * Auth Service Interface
 * 
 * This is the ONLY auth interface the application should use.
 * NEVER import Firebase directly in components/pages/API routes.
 * 
 * To migrate to custom auth:
 * 1. Create /lib/auth/providers/custom.ts
 * 2. Change the import below
 * 3. Done - no other code changes needed
 */

import { firebaseClientProvider } from './providers/firebase-client'
import type { AuthProvider } from './types'

// Current auth provider (Firebase Client - for browser use)
export const authProvider: AuthProvider = firebaseClientProvider

// When migrating to custom auth, change to:
// import { customAuthProvider } from './providers/custom'
// export const authProvider: AuthProvider = customAuthProvider

// Re-export auth functions (provider-agnostic)
export const signIn = authProvider.signIn.bind(authProvider)
export const signOut = authProvider.signOut.bind(authProvider)
export const getCurrentUser = authProvider.getCurrentUser.bind(authProvider)
export const onAuthStateChanged = authProvider.onAuthStateChanged.bind(authProvider)

// NOTE: verifyToken is SERVER-SIDE ONLY
// Import from './providers/firebase-server' in API routes

// Re-export types
export type * from './types'

