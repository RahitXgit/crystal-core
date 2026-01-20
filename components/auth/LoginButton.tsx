/**
 * Login Button Component
 * 
 * Uses auth abstraction layer (NOT Firebase directly)
 */

'use client'

import { useAuth } from './AuthProvider'
import { useState } from 'react'

export function LoginButton() {
    const { signIn } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async () => {
        try {
            setLoading(true)
            setError(null)
            await signIn()
        } catch (err: any) {
            setError(err.message || 'Failed to sign in')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={handleLogin}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>

            {error && (
                <p className="text-red-600 text-sm">{error}</p>
            )}
        </div>
    )
}
