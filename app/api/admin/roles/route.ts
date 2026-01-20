/**
 * Admin API - Role Management
 * GET /api/admin/roles - List all roles
 * POST /api/admin/roles/assign - Assign role to user
 * DELETE /api/admin/roles/revoke - Revoke role from user
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { isAdmin } from '@/lib/rbac/permissions'
import { assignRole, revokeRole } from '@/lib/rbac/roles'
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

        const roles = await dataService.getRoles()

        return NextResponse.json({ roles })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})

export const POST = requireAuth(async (req, user) => {
    try {
        const userIsAdmin = await isAdmin(user.id)

        if (!userIsAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { action, userId, roleId, siteCode, expiresAt } = body

        if (action === 'assign') {
            await assignRole(userId, roleId, user.id, siteCode, expiresAt)
            return NextResponse.json({ success: true })
        }

        if (action === 'revoke') {
            const { assignmentId } = body
            await revokeRole(assignmentId, userId)
            return NextResponse.json({ success: true })
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})
