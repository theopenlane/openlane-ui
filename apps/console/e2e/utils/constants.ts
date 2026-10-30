export const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:17608'
// an official hostname so the console renders in official deployment mode
export const E2E_HOST = process.env.E2E_HOST ?? 'localhost'
export const BASE_URL = process.env.E2E_BASE_URL ?? `http://${E2E_HOST}:${process.env.E2E_PORT ?? '3001'}`

// resolves E2E_HOST to this machine inside Chromium, so no hosts file entry is needed
export const BROWSER_ARGS = E2E_HOST === 'localhost' ? [] : [`--host-resolver-rules=MAP ${E2E_HOST} 127.0.0.1`]

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
