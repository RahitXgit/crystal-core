/**
 * User Menu Component
 */

'use client'

import { useAuth } from './AuthProvider'

export function UserMenu() {
    const { user, signOut } = useAuth()

    if (!user) return null

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                {user.photoUrl && (
                    <img
                        src={user.photoUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                    />
                )}
                <span className="text-sm font-medium">{user.name}</span>
            </div>

            <button
                onClick={signOut}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
                Sign Out
            </button>
        </div>
    )
}
