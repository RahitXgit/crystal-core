/**
 * Module Card Component
 * 
 * Displays a module tile on the dashboard
 */

'use client'

import Link from 'next/link'
import type { Module } from '@/lib/data'

interface ModuleCardProps {
    module: Module
}

export function ModuleCard({ module }: ModuleCardProps) {
    return (
        <Link
            href={module.route}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
        >
            <div className="flex flex-col items-center text-center gap-3">
                <div className="text-4xl">{getModuleIcon(module.icon)}</div>
                <h3 className="text-lg font-semibold text-gray-900">{module.module_name}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
            </div>
        </Link>
    )
}

function getModuleIcon(iconName: string): string {
    const icons: Record<string, string> = {
        dashboard: '📊',
        settings: '⚙️',
        hr: '👥',
        wms: '📦',
        procurement: '🛒',
        admin: '🔧',
    }

    return icons[iconName] || '📋'
}
