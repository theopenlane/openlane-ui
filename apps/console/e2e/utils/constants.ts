export const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:17608'
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3001'

// Hardcoded backend default — see core/internal/integrations/cli/config/config.go.
export const PASSWORD = 'mattisthebest1234'

// Stable per-run id so all setup helpers in one playwright invocation
// produce the same email addresses.
export const RUN_ID = process.env.E2E_RUN_ID ?? Date.now().toString(36)

// Per-run email domain. Avoid `openlane.test` and any other static domain
// because the local dev DB tends to have an org with allowed-domains
// auto-join configured for them — that auto-joins our fresh users and
// makes them skip the onboarding wizard.
//
// `.invalid` is RFC 2606 reserved and will never be in any allow list.
// The `runId` makes it unique-enough across parallel CI runs.
export const EMAIL_DOMAIN = process.env.E2E_EMAIL_DOMAIN ?? `e2e-${RUN_ID}.invalid`

export const emailFor = (role: string) => `e2e-${role}-${RUN_ID}@${EMAIL_DOMAIN}`
