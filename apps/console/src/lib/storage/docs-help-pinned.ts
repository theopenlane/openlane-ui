import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/storage/safe-local-storage'

const DOCS_HELP_PINNED_KEY = 'docs-help-pinned'

export const getDocsHelpPinned = (): boolean => safeGetItem(DOCS_HELP_PINNED_KEY) === 'true'

export const setDocsHelpPinned = (pinned: boolean): void => {
  if (pinned) safeSetItem(DOCS_HELP_PINNED_KEY, 'true')
  else safeRemoveItem(DOCS_HELP_PINNED_KEY)
}
