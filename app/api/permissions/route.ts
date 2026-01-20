/**
 * User Permissions API
 * GET /api/permissions - Get current user's permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserPermissions } from '@/lib/rbac/permissions'

export const GET = requireAuth(async (req, user) => {
    try {
        const permissions = await getUserPermissions(user.id)

        return NextResponse.json({ permissions })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})
