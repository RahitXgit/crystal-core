/**
 * User Roles API
 * GET /api/roles - Get current user's roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserRoles } from '@/lib/rbac/permissions'

export const GET = requireAuth(async (req, user) => {
    try {
        const roles = await getUserRoles(user.id)

        return NextResponse.json({ roles })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})
