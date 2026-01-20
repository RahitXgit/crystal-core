/**
 * Admin Panel Page
 * 
 * Manage users, roles, and permissions
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { UserMenu } from '@/components/auth/UserMenu'

interface User {
    user_id: string
    email: string
    name: string
    auth_provider: string
    is_active: boolean
    created_at: string
    last_login_at?: string
}

interface Role {
    role_id: string
    role_code: string
    role_name: string
    description: string
    is_active: boolean
}

interface RoleAssignment {
    assignment_id: string
    user_id: string
    role_id: string
    site_code?: string
    assigned_by: string
    assigned_at: string
    is_active: boolean
}

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [userRoles, setUserRoles] = useState<RoleAssignment[]>([])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (!user) return

        async function fetchData() {
            try {
                const { getFirebaseAuth } = await import('@/lib/auth/providers/firebase-client')
                const auth = getFirebaseAuth()
                const firebaseUser = auth.currentUser

                if (!firebaseUser) {
                    throw new Error('Not authenticated')
                }

                const token = await firebaseUser.getIdToken()

                // Fetch users
                const usersRes = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (!usersRes.ok) {
                    if (usersRes.status === 403) {
                        throw new Error('Access denied - Admin privileges required')
                    }
                    throw new Error('Failed to fetch users')
                }

                const usersData = await usersRes.json()
                setUsers(usersData.users)

                // Fetch roles
                const rolesRes = await fetch('/api/admin/roles', {
                    headers: { 'Authorization': `Bearer ${token}` },
                })

                if (!rolesRes.ok) {
                    throw new Error('Failed to fetch roles')
                }

                const rolesData = await rolesRes.json()
                setRoles(rolesData.roles)

            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    const handleAssignRole = async (userId: string, roleId: string) => {
        try {
            const { getFirebaseAuth } = await import('@/lib/auth/providers/firebase-client')
            const auth = getFirebaseAuth()
            const firebaseUser = auth.currentUser

            if (!firebaseUser) return

            const token = await firebaseUser.getIdToken()

            const res = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'assign',
                    userId,
                    roleId,
                }),
            })

            if (!res.ok) {
                throw new Error('Failed to assign role')
            }

            alert('Role assigned successfully!')
            window.location.reload()
        } catch (err: any) {
            alert(`Error: ${err.message}`)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-lg text-red-600 mb-4">Error: {error}</div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Administration</h1>
                            <p className="text-sm text-gray-500 mt-0.5">User and role management</p>
                        </div>
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Users List - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Users</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{users.length} total users</p>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {users.map((u) => (
                                    <div
                                        key={u.user_id}
                                        onClick={() => setSelectedUser(u)}
                                        className={`px-6 py-4 cursor-pointer transition-colors ${selectedUser?.user_id === u.user_id
                                                ? 'bg-indigo-50 border-l-4 border-indigo-600'
                                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                                    {selectedUser?.user_id === u.user_id && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                                        {u.auth_provider}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Role Assignment - Takes 1 column */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-24">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Assign Role</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {selectedUser ? 'Select a role to assign' : 'Select a user first'}
                                </p>
                            </div>

                            {selectedUser ? (
                                <div>
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{selectedUser.email}</p>
                                    </div>

                                    <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                                        {roles.filter(r => r.is_active).map((role) => (
                                            <div
                                                key={role.role_id}
                                                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">{role.role_name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAssignRole(selectedUser.user_id, role.role_id)}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors whitespace-nowrap"
                                                    >
                                                        Assign
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-500">Select a user to assign roles</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-6">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>
            </main>
        </div>
    )
}
