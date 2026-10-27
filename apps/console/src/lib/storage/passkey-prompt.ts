import { safeGetItem, safeSetItem } from './safe-local-storage'

const PASSKEY_PROMPT_DISMISSED_KEY = 'passkey-prompt'

const getKey = (id: string): string => `${PASSKEY_PROMPT_DISMISSED_KEY}:${id}`

export const getPasskeyPromptDismissalState = (userId: string): boolean => {
  return safeGetItem(getKey(userId)) !== null
}

export const dismissPrompt = (userId: string): void => {
  safeSetItem(getKey(userId), 'true')
}
