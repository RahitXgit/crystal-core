/**
 * Firebase Client Provider
 * 
 * CLIENT-SIDE ONLY - No firebase-admin imports
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    Auth,
    User as FirebaseUser,
} from 'firebase/auth'
import type { AuthProvider, User } from '../types'

// ============================================================================
// CLIENT-SIDE FIREBASE ONLY
// ============================================================================

let firebaseApp: FirebaseApp | null = null
let auth: Auth | null = null

function getFirebaseApp(): FirebaseApp {
    if (firebaseApp) return firebaseApp

    const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }

    // Debug: Log config (remove after testing)
    console.log('Firebase Config:', {
        apiKey: config.apiKey ? '✅ Set' : '❌ Missing',
        authDomain: config.authDomain ? '✅ Set' : '❌ Missing',
        projectId: config.projectId ? '✅ Set' : '❌ Missing',
    })

    // Validate config
    if (!config.apiKey || !config.authDomain || !config.projectId) {
        console.error('Firebase configuration is incomplete:', config)
        throw new Error('Firebase configuration is incomplete. Check your .env.local file and restart the dev server.')
    }

    // Initialize Firebase (client-side)
    const apps = getApps()
    firebaseApp = apps.length > 0 ? apps[0] : initializeApp(config)

    return firebaseApp
}

function getFirebaseAuth(): Auth {
    if (auth) return auth
    auth = getAuth(getFirebaseApp())
    return auth
}

// ============================================================================
// FIREBASE USER MAPPER
// ============================================================================

function mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firebaseUser.email!,
        photoUrl: firebaseUser.photoURL || undefined,
    }
}

// ============================================================================
// FIREBASE CLIENT AUTH PROVIDER (NO ADMIN SDK)
// ============================================================================

export const firebaseClientProvider: AuthProvider = {
    /**
     * Sign in with Google OAuth
     */
    async signIn(provider = 'google'): Promise<User> {
        if (typeof window === 'undefined') {
            throw new Error('signIn can only be called on client-side')
        }

        const auth = getFirebaseAuth()
        const googleProvider = new GoogleAuthProvider()

        const result = await signInWithPopup(auth, googleProvider)
        return mapFirebaseUser(result.user)
    },

    /**
     * Sign out current user
     */
    async signOut(): Promise<void> {
        if (typeof window === 'undefined') {
            throw new Error('signOut can only be called on client-side')
        }

        const auth = getFirebaseAuth()
        await firebaseSignOut(auth)
    },

    /**
     * Get current authenticated user (client-side)
     */
    async getCurrentUser(): Promise<User | null> {
        if (typeof window === 'undefined') {
            return null
        }

        const auth = getFirebaseAuth()
        const firebaseUser = auth.currentUser

        if (!firebaseUser) {
            return null
        }

        return mapFirebaseUser(firebaseUser)
    },

    /**
     * Verify token (NOT IMPLEMENTED ON CLIENT)
     * This should only be called server-side
     */
    async verifyToken(token: string): Promise<User> {
        throw new Error('verifyToken must be called server-side only')
    },

    /**
     * Listen to auth state changes
     */
    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        if (typeof window === 'undefined') {
            return () => { }
        }

        const auth = getFirebaseAuth()

        return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                callback(mapFirebaseUser(firebaseUser))
            } else {
                callback(null)
            }
        })
    },
}

// Export auth instance for getting tokens
export { getFirebaseAuth }
