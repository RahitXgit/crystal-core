/**
 * Firebase Server Provider
 * 
 * SERVER-SIDE ONLY - For API routes
 */

import * as admin from 'firebase-admin'
import type { User } from '../types'

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

/**
 * Verify Firebase ID token (server-side only)
 */
export async function verifyFirebaseToken(token: string): Promise<User> {
    const adminApp = getAdminApp()
    const decodedToken = await adminApp.auth().verifyIdToken(token)

    return {
        id: decodedToken.uid,
        email: decodedToken.email!,
        name: decodedToken.name || decodedToken.email!,
        photoUrl: decodedToken.picture,
    }
}

export { getAdminApp }
