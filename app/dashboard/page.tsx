/**
 * Dashboard Page
 * 
 * Dynamic landing page - shows modules based on user permissions
 */

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ModuleCard } from '@/components/dashboard/ModuleCard'
import { UserMenu } from '@/components/auth/UserMenu'
import type { Module } from '@/lib/data'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [modules, setModules] = useState<Module[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (!user) return

        async function fetchModules() {
            try {
                // Get Firebase ID token
                const { getFirebaseAuth } = await import('@/lib/auth/providers/firebase-client')
                const auth = getFirebaseAuth()
                const firebaseUser = auth.currentUser

                if (!firebaseUser) {
                    throw new Error('Not authenticated')
                }

                const token = await firebaseUser.getIdToken()

                const res = await fetch('/api/modules', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                })

                if (!res.ok) {
                    throw new Error('Failed to fetch modules')
                }

                const data = await res.json()
                setModules(data.modules)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchModules()
    }, [user])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-red-600">Error: {error}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Crystal Core</h1>
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Welcome, {user?.name}
                    </h2>
                    <p className="text-gray-600">Select a module to get started</p>
                </div>

                {modules.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">No modules available. Contact your administrator.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.map((module) => (
                            <ModuleCard key={module.module_id} module={module} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
