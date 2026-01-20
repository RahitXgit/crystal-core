/**
 * Google Sheets API Client
 * 
 * Features:
 * - Service account authentication
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Read/write/append operations
 */

import { google } from 'googleapis'
import { SHEETS_CONFIG } from './config'

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

class CircuitBreaker {
    private failures = 0
    private readonly threshold = 5
    private readonly timeout = 60000 // 1 minute
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
    private nextAttempt: number | null = null

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (this.nextAttempt && Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN - Sheets API temporarily unavailable')
            }
            this.state = 'HALF_OPEN'
        }

        try {
            const result = await fn()
            this.onSuccess()
            return result
        } catch (error) {
            this.onFailure()
            throw error
        }
    }

    private onSuccess() {
        this.failures = 0
        this.state = 'CLOSED'
    }

    private onFailure() {
        this.failures++
        if (this.failures >= this.threshold) {
            this.state = 'OPEN'
            this.nextAttempt = Date.now() + this.timeout
            console.error(`Circuit breaker OPEN after ${this.failures} failures`)
        }
    }

    getState() {
        return this.state
    }
}

const circuitBreaker = new CircuitBreaker()

// ============================================================================
// RETRY LOGIC
// ============================================================================

async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3
): Promise<T> {
    const delays = [200, 500, 1000] // exponential backoff

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (error: any) {
            const isRetryable =
                error.code === 'ETIMEDOUT' ||
                error.code === 'ECONNRESET' ||
                (error.response?.status >= 500) ||
                error.response?.status === 429

            if (!isRetryable || i === maxRetries - 1) {
                throw error
            }

            await new Promise(resolve => setTimeout(resolve, delays[i]))
        }
    }

    throw new Error('Max retries exceeded')
}

// ============================================================================
// SHEETS CLIENT
// ============================================================================

class SheetsClient {
    private sheets: any
    private auth: any

    constructor() {
        this.initializeAuth()
    }

    private initializeAuth() {
        const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

        if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
            throw new Error('Google Sheets credentials not configured')
        }

        this.auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        this.sheets = google.sheets({ version: 'v4', auth: this.auth })
    }

    /**
     * Read data from a sheet
     */
    async read(sheetName: string, range?: string): Promise<any[][]> {
        const fullRange = range ? `${sheetName}!${range}` : sheetName

        return circuitBreaker.execute(() =>
            retryWithBackoff(async () => {
                const response = await this.sheets.spreadsheets.values.get({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: fullRange,
                })

                return response.data.values || []
            })
        )
    }

    /**
     * Write data to a sheet (overwrites)
     */
    async write(sheetName: string, range: string, values: any[][]): Promise<void> {
        return circuitBreaker.execute(() =>
            retryWithBackoff(async () => {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: `${sheetName}!${range}`,
                    valueInputOption: 'RAW',
                    requestBody: { values },
                })
            })
        )
    }

    /**
     * Append data to a sheet
     */
    async append(sheetName: string, values: any[][]): Promise<void> {
        return circuitBreaker.execute(() =>
            retryWithBackoff(async () => {
                await this.sheets.spreadsheets.values.append({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: sheetName,
                    valueInputOption: 'RAW',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values },
                })
            })
        )
    }

    /**
     * Batch read multiple ranges
     */
    async batchRead(ranges: string[]): Promise<Record<string, any[][]>> {
        return circuitBreaker.execute(() =>
            retryWithBackoff(async () => {
                const response = await this.sheets.spreadsheets.values.batchGet({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    ranges,
                })

                const result: Record<string, any[][]> = {}
                response.data.valueRanges?.forEach((vr: any, index: number) => {
                    result[ranges[index]] = vr.values || []
                })

                return result
            })
        )
    }

    /**
     * Clear a range
     */
    async clear(sheetName: string, range?: string): Promise<void> {
        const fullRange = range ? `${sheetName}!${range}` : sheetName

        return circuitBreaker.execute(() =>
            retryWithBackoff(async () => {
                await this.sheets.spreadsheets.values.clear({
                    spreadsheetId: SHEETS_CONFIG.spreadsheetId,
                    range: fullRange,
                })
            })
        )
    }

    /**
     * Get circuit breaker state (for monitoring)
     */
    getCircuitBreakerState() {
        return circuitBreaker.getState()
    }
}

// Singleton instance
let sheetsClient: SheetsClient | null = null

export function getSheetsClient(): SheetsClient {
    if (!sheetsClient) {
        sheetsClient = new SheetsClient()
    }
    return sheetsClient
}

export { CircuitBreaker }
