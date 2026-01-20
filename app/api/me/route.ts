/**
 * User Profile API
 * GET /api/me - Get current user profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { dataService } from '@/lib/data'

export const GET = requireAuth(async (req, user) => {
    try {
        const dbUser = await dataService.getUserById(user.id)

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            user: {
                user_id: dbUser.user_id,
                email: dbUser.email,
                name: dbUser.name,
                is_active: dbUser.is_active,
                last_login_at: dbUser.last_login_at,
            },
        })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})
