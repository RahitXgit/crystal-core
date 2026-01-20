/**
 * Admin API - User Management
 * GET /api/admin/users - List all users
 * POST /api/admin/users - Create user
 * PATCH /api/admin/users/[id] - Update user
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { isAdmin } from '@/lib/rbac/permissions'
import { dataService } from '@/lib/data'

export const GET = requireAuth(async (req, user) => {
    try {
        // Check if user is admin
        const userIsAdmin = await isAdmin(user.id)

        if (!userIsAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        const users = await dataService.getUsers()

        return NextResponse.json({ users })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})

export const POST = requireAuth(async (req, user) => {
    try {
        // Check if user is admin
        const userIsAdmin = await isAdmin(user.id)

        if (!userIsAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        const body = await req.json()
        const { email, name, auth_provider } = body

        // Create user
        const newUser = await dataService.createUser({
            email,
            name,
            auth_provider: auth_provider || 'email',
            is_active: true,
        })

        return NextResponse.json({ user: newUser })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})
