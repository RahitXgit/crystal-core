/**
 * Login Page
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { LoginButton } from '@/components/auth/LoginButton'

export default function LoginPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard')
        }
    }, [user, loading, router])

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        )
    }

    // Show login page if not authenticated
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Crystal Core</h1>
                    <p className="text-gray-600">Internal Operations Platform</p>
                </div>

                <LoginButton />
            </div>
        </div>
    )
}
