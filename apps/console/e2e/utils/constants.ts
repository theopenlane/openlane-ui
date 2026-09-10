export const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:17608'
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001'

export const PASSWORD = 'mattisthebest1234'

export const RUN_ID = process.env.E2E_RUN_ID ?? Date.now().toString(36)

export const EMAIL_DOMAIN = process.env.E2E_EMAIL_DOMAIN ?? `e2e-${RUN_ID}.invalid`

export const emailFor = (role: string) => `e2e-${role}-${RUN_ID}@${EMAIL_DOMAIN}`
