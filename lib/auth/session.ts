/**
 * Server-Side Session Management
 * 
 * Provider-agnostic session handling for API routes.
 */

import { NextRequest } from 'next/server'
import { verifyFirebaseToken } from './providers/firebase-server'
import type { User } from './types'

/**
 * Get session from request (extract token from Authorization header)
 */
export async function getServerSession(req: NextRequest): Promise<User | null> {
    try {
        const authHeader = req.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix
        const user = await verifyFirebaseToken(token)

        return user
    } catch (error) {
        console.error('Session verification failed:', error)
        return null
    }
}

/**
 * Require authentication middleware for API routes
 */
export function requireAuth(
    handler: (req: NextRequest, user: User) => Promise<Response>
) {
    return async (req: NextRequest): Promise<Response> => {
        const user = await getServerSession(req)

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }

        return handler(req, user)
    }
}
