import { dedupeByEmail, getRecipientDisplayName } from './target-entry'

export interface RecipientOption {
  id: string
  email: string
  name: string
  meta?: string
}

const hasDisplayName = (option: RecipientOption): boolean => getRecipientDisplayName(option.name, option.email) !== ''

const preferNamedOption = (current: RecipientOption, incoming: RecipientOption): RecipientOption => {
  const [winner, loser] = hasDisplayName(current) || !hasDisplayName(incoming) ? [current, incoming] : [incoming, current]
  return { ...winner, meta: winner.meta ?? loser.meta }
}

export const dedupeRecipientOptions = (options: RecipientOption[]): RecipientOption[] => dedupeByEmail(options, (option) => option.email, preferNamedOption)
