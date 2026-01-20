/**
 * Admin API - Get User Role Assignments
 * GET /api/admin/users/[userId]/roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { isAdmin } from '@/lib/rbac/permissions'
import { dataService } from '@/lib/data'

export const GET = requireAuth(async (req, user) => {
    try {
        const userIsAdmin = await isAdmin(user.id)

        if (!userIsAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        // Get userId from URL
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const userId = pathParts[pathParts.length - 2] // .../users/[userId]/roles

        const assignments = await dataService.getRoleAssignments(userId)

        return NextResponse.json({ assignments })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})
