import { normalizeEmail } from '@/lib/validators'
import { type TPagination } from '@repo/ui/pagination-types'

export type TargetTab = 'personnel' | 'contacts' | 'csv' | 'manual'

export type TargetSource = 'personnel' | 'contact' | 'manual'

export interface CampaignTargetEntry {
  email: string
  fullName: string
  source: TargetSource
  contactID?: string
}

export const ALL_SCOPE = 'ALL'

export const PICKER_PAGE_SIZE = 5

export const PICKER_PAGINATION: TPagination = { page: 1, pageSize: PICKER_PAGE_SIZE, query: { first: PICKER_PAGE_SIZE } }

export const EMPTY_EMAIL_KEYS: ReadonlySet<string> = new Set()

export const toEmailKeys = (emails: string[]): ReadonlySet<string> => new Set(emails.map(normalizeEmail).filter(Boolean))

export const hasTarget = (targets: CampaignTargetEntry[], email: string): boolean => targets.some((target) => normalizeEmail(target.email) === normalizeEmail(email))

export const dedupeByEmail = <T>(items: T[], getEmail: (item: T) => string, merge: (current: T, incoming: T) => T): T[] => {
  const byEmail = new Map<string, T>()

  items.forEach((item) => {
    const key = normalizeEmail(getEmail(item))
    if (!key) return
    const current = byEmail.get(key)
    byEmail.set(key, current ? merge(current, item) : item)
  })

  return Array.from(byEmail.values())
}

const enrichTarget = (existing: CampaignTargetEntry, incoming: CampaignTargetEntry): CampaignTargetEntry => ({
  ...existing,
  fullName: existing.fullName || incoming.fullName,
  contactID: existing.contactID ?? incoming.contactID,
})

export const mergeTargets = (existing: CampaignTargetEntry[], incoming: CampaignTargetEntry[]): CampaignTargetEntry[] =>
  dedupeByEmail([...existing, ...incoming], (target) => target.email, enrichTarget)

export const removeTarget = (targets: CampaignTargetEntry[], email: string): CampaignTargetEntry[] => targets.filter((target) => normalizeEmail(target.email) !== normalizeEmail(email))

export const toggleTarget = (targets: CampaignTargetEntry[], entry: CampaignTargetEntry): CampaignTargetEntry[] =>
  hasTarget(targets, entry.email) ? removeTarget(targets, entry.email) : mergeTargets(targets, [entry])

export const getRecipientDisplayName = (name: string, email: string): string => {
  const trimmed = name.trim()
  return normalizeEmail(trimmed) === normalizeEmail(email) ? '' : trimmed
}
