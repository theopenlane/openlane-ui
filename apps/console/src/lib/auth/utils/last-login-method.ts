import { UserAuthProvider } from '@repo/codegen/src/schema'

const LAST_LOGIN_METHOD_KEY = 'last_login_method'

export const recordLastLoginMethod = (provider: UserAuthProvider) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_LOGIN_METHOD_KEY, provider)
  } catch {
    // storage unavailable
  }
}

export const getLastLoginMethod = (): UserAuthProvider | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LAST_LOGIN_METHOD_KEY)
    return raw && Object.values(UserAuthProvider).includes(raw as UserAuthProvider) ? (raw as UserAuthProvider) : null
  } catch {
    return null
  }
}
