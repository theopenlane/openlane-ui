import { addDays, subDays, startOfDay, isValid } from 'date-fns'
import { type Condition } from '@/types'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'

export const DUE_SOON_WINDOW_DAYS = 14

export type SlaDaysByLevel = Record<string, number>

export const buildSlaDaysByLevel = (slaDefinitions: SlaDefinitionsNodeNonNull[]): SlaDaysByLevel =>
  slaDefinitions.reduce<SlaDaysByLevel>((acc, def) => {
    const level = def.securityLevel?.toUpperCase()
    if (level && !(level in acc) && typeof def.slaDays === 'number' && def.slaDays > 0) {
      acc[level] = def.slaDays
    }
    return acc
  }, {})

export const getSlaDueDate = (createdAt: string | null | undefined, securityLevel: string | null | undefined, slaDaysByLevel: SlaDaysByLevel): Date | null => {
  if (!createdAt || !securityLevel) return null
  const slaDays = slaDaysByLevel[securityLevel.toUpperCase()]
  if (typeof slaDays !== 'number') return null
  const createdDate = new Date(createdAt)
  if (!isValid(createdDate)) return null
  return addDays(createdDate, slaDays)
}

export const isSlaPastDue = (dueDate: Date | null | undefined): boolean => !!dueDate && dueDate < new Date()

const buildSeverityDateCondition = (slaDaysByLevel: SlaDaysByLevel, toDateCondition: (slaDays: number) => Condition): Condition => ({
  open: true,
  or: Object.entries(slaDaysByLevel).map(([securityLevel, slaDays]) => ({ securityLevel, ...toDateCondition(slaDays) })),
})

export const buildPastDueCondition = (slaDaysByLevel: SlaDaysByLevel): Condition =>
  buildSeverityDateCondition(slaDaysByLevel, (slaDays) => ({ createdAtLT: subDays(startOfDay(new Date()), slaDays).toISOString() }))

export const buildDueSoonCondition = (slaDaysByLevel: SlaDaysByLevel): Condition =>
  buildSeverityDateCondition(slaDaysByLevel, (slaDays) => {
    const lower = subDays(startOfDay(new Date()), slaDays)
    return {
      createdAtGTE: lower.toISOString(),
      createdAtLT: addDays(lower, DUE_SOON_WINDOW_DAYS).toISOString(),
    }
  })
