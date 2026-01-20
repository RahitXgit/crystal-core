/**
 * Modules API
 * GET /api/modules - Get modules accessible to current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getUserModules } from '@/lib/rbac/permissions'
import { dataService } from '@/lib/data'

export const GET = requireAuth(async (req, user) => {
    try {
        // Get user's accessible module codes
        const moduleCodes = await getUserModules(user.id)

        // Get all active modules
        const allModules = await dataService.getActiveModules()

        // Filter modules by user access
        const accessibleModules = allModules.filter(m =>
            moduleCodes.includes(m.module_code)
        )

        return NextResponse.json({ modules: accessibleModules })
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
})
