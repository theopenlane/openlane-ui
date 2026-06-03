import { type UserAuthProvider } from '@repo/codegen/src/schema'

const LAST_LOGIN_METHOD_KEY = 'last_login_method'

// records the method used at sign-in or registration so the login screen can show a per-device "last used" hint
export const recordLastLoginMethod = (provider: UserAuthProvider) => {
  localStorage.setItem(LAST_LOGIN_METHOD_KEY, provider)
}

// returns the method most recently used to sign in on this device
export const getLastLoginMethod = (): UserAuthProvider | null => {
  return localStorage.getItem(LAST_LOGIN_METHOD_KEY) as UserAuthProvider | null
}
