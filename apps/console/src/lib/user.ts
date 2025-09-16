import { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/types'
import useSWR from 'swr'

export interface LoginUser {
  username: string
  password: string
}

export interface RegisterUser {
  username: string
  password: string
  confirmedPassword?: string
  token?: string
  email: string
}

export interface ResendVerificationEmail {
  email: string
}

export interface PasskeyRegOptionsInput {
  email: string
  name?: string
}

export interface PasskeySignInOptionsInput {
  email: string
}

export interface RegistrationVerificationInput {
  attestationResponse: RegistrationResponseJSON
}

export interface AuthVerificationInput {
  assertionResponse: AuthenticationResponseJSON
}

export interface HttpResponse<T> extends Response {
  message?: T
}

export interface SwitchOrganization {
  target_organization_id: string
}

type RegisterUserResponse<T> = { ok: true; data: T } | { ok: false; message: string }

export async function registerUser<T>(arg: RegisterUser): Promise<RegisterUserResponse<T>> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arg),
    })

    const json = await response.json()

    if (response.ok) {
      return { ok: true, data: json }
    } else {
      return { ok: false, message: json?.error ?? 'Unknown error' }
    }
  } catch {
    return { ok: false, message: 'Network error' }
  }
}

export async function resendVerification<T>(arg: ResendVerificationEmail) {
  const fData: HttpResponse<T> = await fetch('/api/auth/resend', {
    method: 'POST',
    body: JSON.stringify(arg),
  })
  try {
    const fDataMessage = await fData.json()
    fData.message = fDataMessage.error
    return fData
  } catch {
    return { message: 'error' }
  }
}

export const useVerifyUser = (arg: string | null) => {
  const { data, isLoading, error } = useSWR(
    arg ? `/api/auth/verify?token=${arg}` : null,
    async (url) => {
      return (await fetch(url)).json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      refreshInterval: 0,
      revalidateIfStale: false,
    },
  )
  return {
    verified: data,
    isLoading,
    error,
  }
}

export const useAcceptOrganizationInvite = (token: string | null, enabled: boolean) => {
  const { data, isLoading, error } = useSWR(
    enabled && token ? `/api/auth/invite?token=${token}` : null,
    async (url) => {
      return (
        await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      ).json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true, // prevent auto revalidate
      refreshInterval: 0,
      revalidateIfStale: false,
    },
  )

  return {
    verified: data,
    isLoading,
    error,
  }
}

export async function getPasskeyRegOptions<T>(arg: PasskeyRegOptionsInput) {
  const fData: HttpResponse<T> = await fetch('/api/auth/registration-options', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
    credentials: 'include',
  })

  const data = await fData.json()
  try {
    return data
  } catch {
    return { message: 'error' }
  }
}

export async function verifyRegistration<T>(arg: RegistrationVerificationInput) {
  const fData: HttpResponse<T> = await fetch('/api/auth/registration-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg.attestationResponse),
    credentials: 'include',
  })
  try {
    return await fData.json()
  } catch {
    return { message: 'error' }
  }
}

export async function getPasskeySignInOptions<T>(arg: PasskeySignInOptionsInput) {
  const fData: HttpResponse<T> = await fetch('/api/auth/signin-options', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
    credentials: 'include',
  })

  const data = await fData.json()
  try {
    return data
  } catch {
    return { message: 'error' }
  }
}

export async function verifyAuthentication<T>(arg: AuthVerificationInput) {
  const fData: HttpResponse<T> = await fetch('/api/auth/authentication-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg.assertionResponse),
  })
  try {
    return await fData.json()
  } catch {
    return { message: 'error' }
  }
}

// this handles SSO redirect if required by the response
//
// The response from switchOrganization or similar auth functions
//
// organizationId The target organization ID to store in localStorage
export function handleSSORedirect(response: { needs_sso?: string; redirect_uri?: string }, organizationId: string): boolean {
  if (response?.needs_sso && response?.redirect_uri) {
    localStorage.setItem('sso_organization_id', organizationId)

    window.location.href = response.redirect_uri
    return true
  }

  return false
}

export async function switchOrganization<T>(arg: SwitchOrganization) {
  const fData: HttpResponse<T> = await fetch('/api/auth/switch-organization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  })
  try {
    const fDataMessage = await fData.json()
    fData.message = fDataMessage.error
    return fDataMessage
  } catch {
    return { message: 'error' }
  }
}
