/**
 * Firebase Auth Provider
 * 
 * Implements AuthProvider interface using Firebase.
 * This is ONE possible auth provider - can be swapped for custom auth later.
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
import * as admin from 'firebase-admin'
import type { AuthProvider, User } from '../types'

// ============================================================================
// CLIENT-SIDE FIREBASE
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

    // Validate config
    if (!config.apiKey || !config.authDomain || !config.projectId) {
        throw new Error('Firebase configuration is incomplete')
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
// SERVER-SIDE FIREBASE ADMIN
// ============================================================================

let adminApp: admin.app.App | null = null

function getAdminApp(): admin.app.App {
    if (adminApp) return adminApp

    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
        throw new Error('Firebase Admin credentials are incomplete')
    }

    // Initialize Firebase Admin (server-side)
    if (admin.apps.length === 0) {
        adminApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey,
            }),
        })
    } else {
        adminApp = admin.apps[0]!
    }

    return adminApp
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
// FIREBASE AUTH PROVIDER IMPLEMENTATION
// ============================================================================

export const firebaseAuthProvider: AuthProvider = {
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
     * Verify Firebase ID token (server-side)
     */
    async verifyToken(token: string): Promise<User> {
        const adminApp = getAdminApp()
        const decodedToken = await adminApp.auth().verifyIdToken(token)

        return {
            id: decodedToken.uid,
            email: decodedToken.email!,
            name: decodedToken.name || decodedToken.email!,
            photoUrl: decodedToken.picture,
        }
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

// Export for server-side token verification
export { getAdminApp }
