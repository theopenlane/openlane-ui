import { addDays, subDays, startOfDay } from 'date-fns'
import { type Condition } from '@/types'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'

export const DUE_SOON_WINDOW_DAYS = 14

export type SlaDaysByLevel = Record<string, number>

export const isPositiveSlaDays = (value: number | null | undefined): value is number => typeof value === 'number' && value > 0

export const buildSlaDaysByLevel = (slaDefinitions: SlaDefinitionsNodeNonNull[]): SlaDaysByLevel =>
  slaDefinitions.reduce<SlaDaysByLevel>((acc, def) => {
    const level = def.securityLevel?.toUpperCase()
    if (level && !(level in acc) && isPositiveSlaDays(def.slaDays)) {
      acc[level] = def.slaDays
    }
    return acc
  }, {})

export const getEffectiveSlaDays = (remediationSLA: number | null | undefined, defaultSlaDays: number | null | undefined): number | null =>
  isPositiveSlaDays(remediationSLA) ? remediationSLA : isPositiveSlaDays(defaultSlaDays) ? defaultSlaDays : null

export const isSlaPastDue = (dueDate: Date | null | undefined): boolean => !!dueDate && dueDate < new Date()

export type TSlaSourceDateField = 'reportedAt' | 'discoveredAt'

type TDateRange = { gte?: string; lt: string }

const dateRangeCondition = (field: string, { gte, lt }: TDateRange): Condition => ({ ...(gte && { [`${field}GTE`]: gte }), [`${field}LT`]: lt })

const baseDateCondition = (range: TDateRange, sourceDateField?: TSlaSourceDateField): Condition =>
  sourceDateField ? { or: [dateRangeCondition(sourceDateField, range), { [`${sourceDateField}IsNil`]: true, ...dateRangeCondition('createdAt', range) }] } : dateRangeCondition('createdAt', range)

const buildSeverityDateCondition = (slaDaysByLevel: SlaDaysByLevel, toDateCondition: (slaDays: number) => Condition): Condition => ({
  open: true,
  or: Object.entries(slaDaysByLevel).map(([securityLevel, slaDays]) => ({ securityLevel, ...toDateCondition(slaDays) })),
})

export const buildPastDueCondition = (slaDaysByLevel: SlaDaysByLevel, sourceDateField?: TSlaSourceDateField): Condition =>
  buildSeverityDateCondition(slaDaysByLevel, (slaDays) => baseDateCondition({ lt: subDays(startOfDay(new Date()), slaDays).toISOString() }, sourceDateField))

export const buildDueSoonCondition = (slaDaysByLevel: SlaDaysByLevel, sourceDateField?: TSlaSourceDateField): Condition =>
  buildSeverityDateCondition(slaDaysByLevel, (slaDays) => {
    const lower = subDays(startOfDay(new Date()), slaDays)
    return baseDateCondition({ gte: lower.toISOString(), lt: addDays(lower, DUE_SOON_WINDOW_DAYS).toISOString() }, sourceDateField)
  })
