/**
 * Generic Auth Types
 * 
 * These types are provider-agnostic and used throughout the application.
 * NEVER import Firebase-specific types in application code.
 */

export interface User {
  id: string
  email: string
  name: string
  photoUrl?: string
}

export interface Session {
  user: User
  token: string
  expiresAt: Date
}

export interface AuthProvider {
  /**
   * Sign in with the provider
   * @param provider - Provider name (e.g., 'google', 'email')
   * @param credentials - Optional credentials (email/password for custom auth)
   */
  signIn(provider?: string, credentials?: any): Promise<User>
  
  /**
   * Sign out current user
   */
  signOut(): Promise<void>
  
  /**
   * Get current authenticated user (client-side)
   */
  getCurrentUser(): Promise<User | null>
  
  /**
   * Verify authentication token (server-side)
   * @param token - Auth token to verify
   */
  verifyToken(token: string): Promise<User>
  
  /**
   * Listen to auth state changes
   * @param callback - Called when auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void
}
