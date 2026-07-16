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

export const hasTarget = (targets: CampaignTargetEntry[], email: string): boolean => targets.some((target) => normalizeEmail(target.email) === normalizeEmail(email))

const enrichTarget = (existing: CampaignTargetEntry, incoming: CampaignTargetEntry): CampaignTargetEntry => ({
  ...existing,
  fullName: existing.fullName || incoming.fullName,
  contactID: existing.contactID ?? incoming.contactID,
})

export const mergeTargets = (existing: CampaignTargetEntry[], incoming: CampaignTargetEntry[]): CampaignTargetEntry[] => {
  const byEmail = new Map<string, CampaignTargetEntry>()

  ;[...existing, ...incoming].forEach((target) => {
    const key = normalizeEmail(target.email)
    if (!key) return
    const current = byEmail.get(key)
    byEmail.set(key, current ? enrichTarget(current, target) : target)
  })

  return Array.from(byEmail.values())
}

export const removeTarget = (targets: CampaignTargetEntry[], email: string): CampaignTargetEntry[] => targets.filter((target) => normalizeEmail(target.email) !== normalizeEmail(email))

export const toggleTarget = (targets: CampaignTargetEntry[], entry: CampaignTargetEntry): CampaignTargetEntry[] =>
  hasTarget(targets, entry.email) ? removeTarget(targets, entry.email) : mergeTargets(targets, [entry])
