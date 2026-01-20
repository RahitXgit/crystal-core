/**
 * Auth API Routes
 * POST /api/auth/login - Verify Firebase token and create/update user
 * POST /api/auth/logout - Clear session
 * GET /api/auth/session - Get current session
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/auth/providers/firebase-server'
import { dataService } from '@/lib/data'

export async function POST(req: NextRequest) {
    try {
        const { token, action } = await req.json()

        if (action === 'login') {
            // Verify Firebase token
            const user = await verifyFirebaseToken(token)

            // Check if user exists in database (by Firebase UID)
            let dbUser = await dataService.getUserById(user.id)

            if (!dbUser) {
                // Create new user with Firebase UID
                dbUser = await dataService.createUser({
                    user_id: user.id, // Use Firebase UID
                    email: user.email,
                    name: user.name,
                    auth_provider: 'google',
                    is_active: true,
                } as any) // Type assertion needed since we're passing user_id
            } else {
                // Update last login
                await dataService.updateUser(dbUser.user_id, {
                    last_login_at: new Date().toISOString(),
                })
            }

            return NextResponse.json({
                success: true,
                user: {
                    id: dbUser.user_id,
                    email: dbUser.email,
                    name: dbUser.name,
                },
            })
        }

        if (action === 'logout') {
            return NextResponse.json({ success: true })
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )
    } catch (error: any) {
        console.error('Auth error:', error)
        return NextResponse.json(
            { error: error.message || 'Authentication failed' },
            { status: 401 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ user: null })
        }

        const token = authHeader.substring(7)
        const user = await verifyFirebaseToken(token)

        return NextResponse.json({ user })
    } catch (error) {
        return NextResponse.json({ user: null })
    }
}
