import useSWR from 'swr'

export interface LoginUser {
  username: string
  password: string
}

export interface RegisterUser {
  username: string
  password: string
  confirmedPassword?: string
}

export interface ResendVerificationEmail {
  email: string
}

export interface PasskeyRegOptionsInput {
  email: string
  name: string
}

export interface PasskeySignInOptionsInput {
  email: string
}

export interface RegistrationVerificationInput {
  attestationResponse: any
}

export interface AuthVerificationInput {
  assertionResponse: any
}
interface HttpResponse<T> extends Response {
  message?: T
}

export interface SwitchOrganization {
  target_organization_id: string
}

export async function registerUser<T>(arg: RegisterUser) {
  const fData: HttpResponse<T> = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  })
  try {
    const fDataMessage = await fData.json()
    fData.message = fDataMessage.error
    return fData
  } catch (error) {
    return { message: 'error' }
  }
}

export async function resendVerification<T>(arg: ResendVerificationEmail) {
  const fData: HttpResponse<T> = await fetch('/api/auth/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
  })
  try {
    const fDataMessage = await fData.json()
    fData.message = fDataMessage.error
    return fData
  } catch (error) {
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

export const useAcceptOrganizationInvite = (arg: string | null) => {
  const { data, isLoading, error } = useSWR(
    arg ? `/api/auth/invite?token=${arg}` : null,
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
  } catch (error) {
    return { message: 'error' }
  }
}

export async function verifyRegistration<T>(arg: RegistrationVerificationInput) {
  const fData: HttpResponse<T> = await fetch('/api/auth/registration-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
    credentials: 'include',
  })
  try {
    return await fData.json()
  } catch (error) {
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
  } catch (error) {
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
    credentials: 'include',
  })
  try {
    return await fData.json()
  } catch (error) {
    return { message: 'error' }
  }
}

export async function switchOrganization<T>(arg: SwitchOrganization) {
  const fData: HttpResponse<T> = await fetch('/api/auth/switch-organization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(arg),
    credentials: 'include',
  })
  try {
    const fDataMessage = await fData.json()
    fData.message = fDataMessage.error
    return fDataMessage
  } catch (error) {
    return { message: 'error' }
  }
}
