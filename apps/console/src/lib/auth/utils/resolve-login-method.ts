'use server'

import { isValidEmail } from '@/lib/validators'
import { fetchWebfinger, hasUsableSSO } from './webfinger'

export type TLoginMethod = { sso: false } | { sso: true; enforced: boolean; passwordAllowed: boolean }

export const resolveLoginMethod = async (email: string): Promise<TLoginMethod> => {
  if (typeof email !== 'string' || !isValidEmail(email)) {
    return { sso: false }
  }

  const config = await fetchWebfinger(email)

  if (!config || !hasUsableSSO(config)) {
    return { sso: false }
  }

  return {
    sso: true,
    enforced: config.enforced,
    passwordAllowed: !config.enforced || Boolean(config.is_org_owner),
  }
}
