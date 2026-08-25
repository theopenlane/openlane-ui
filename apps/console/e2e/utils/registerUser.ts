import { API_BASE, PASSWORD } from './constants'

export interface RegisterUserInput {
  email: string
  firstName?: string
  lastName?: string
  password?: string
}

interface RegisterResponse {
  id: string
  email: string
  message: string
  token?: string
}

/**
 * Register a new user and complete email verification.
 *
 * Relies on the backend's dev-mode behavior (`server.dev: true`) which
 * returns the verification token in the /v1/register response body —
 * see core/internal/httpserve/handlers/register.go:137-140. Without dev
 * mode, the token would only be deliverable by email and this helper
 * would fail.
 */
export const registerAndVerify = async (input: RegisterUserInput): Promise<{ email: string; password: string }> => {
  const password = input.password ?? PASSWORD
  const firstName = input.firstName ?? 'E2E'
  const lastName = input.lastName ?? 'User'

  const reg = await fetch(`${API_BASE}/v1/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: input.email, password, firstName, lastName }),
  })

  if (!reg.ok) {
    throw new Error(`register failed: ${reg.status} ${await reg.text()}`)
  }

  const body = (await reg.json()) as RegisterResponse
  if (!body.token) {
    throw new Error('register response missing token — is the backend running with server.dev=true?')
  }

  const verify = await fetch(`${API_BASE}/v1/verify?token=${encodeURIComponent(body.token)}`)
  if (!verify.ok) {
    throw new Error(`verify failed: ${verify.status} ${await verify.text()}`)
  }

  return { email: input.email, password }
}
