/**
 * Utility Functions
 */

import { randomUUID } from 'crypto'

/**
 * Generate UUID
 */
export function generateId(): string {
    return randomUUID()
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
    return new Date().toISOString()
}

/**
 * Parse boolean from string
 */
export function parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
        return value.toUpperCase() === 'TRUE'
    }
    return false
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T = any>(value: string | undefined | null, fallback: T): T {
    if (!value) return fallback
    try {
        return JSON.parse(value)
    } catch {
        return fallback
    }
}

/**
 * Wait for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Class name utility (for Tailwind)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ')
}
