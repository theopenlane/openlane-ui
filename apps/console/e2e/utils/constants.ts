export const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:17608'
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001'

export const PASSWORD = 'mattisthebest1234'

// auth form fields are matched by name so copy changes don't break selectors
export const LOGIN_EMAIL_INPUT = 'input[name="username"]'
export const SIGNUP_EMAIL_INPUT = 'input[name="email"]'
export const PASSWORD_INPUT = 'input[name="password"]'
export const CONFIRM_PASSWORD_INPUT = 'input[name="confirmedPassword"]'

export const RUN_ID = process.env.E2E_RUN_ID ?? Date.now().toString(36)

export const EMAIL_DOMAIN = process.env.E2E_EMAIL_DOMAIN ?? `e2e-${RUN_ID}.invalid`

export const emailFor = (role: string) => `e2e-${role}-${RUN_ID}@${EMAIL_DOMAIN}`

export const isolatedEmailFor = (role: string, domainSlug: string) => `e2e-${role}@${domainSlug}-${RUN_ID}.invalid`.toLowerCase()
