/**
 * Auth Context Provider
 * 
 * Manages authentication state on client-side.
 * Uses auth abstraction layer (provider-agnostic).
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { signIn as authSignIn, signOut as authSignOut, onAuthStateChanged, getCurrentUser } from '@/lib/auth'
import type { User } from '@/lib/auth'

interface AuthContextType {
    user: User | null
    loading: boolean
    signIn: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged(async (authUser) => {
            if (authUser) {
                // Get Firebase auth instance to get ID token
                try {
                    const { getFirebaseAuth } = await import('@/lib/auth/providers/firebase-client')
                    const auth = getFirebaseAuth()
                    const firebaseUser = auth.currentUser

                    if (firebaseUser) {
                        const token = await firebaseUser.getIdToken()

                        // Sync with backend (create/update user in database)
                        await fetch('/api/auth', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token, action: 'login' }),
                        })
                    }
                } catch (error) {
                    console.error('Error syncing user:', error)
                }
            }

            setUser(authUser)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const handleSignIn = async () => {
        try {
            setLoading(true)
            await authSignIn('google')
        } catch (error) {
            console.error('Sign in error:', error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleSignOut = async () => {
        try {
            setLoading(true)
            await authSignOut()
            setUser(null)
        } catch (error) {
            console.error('Sign out error:', error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signOut: handleSignOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
