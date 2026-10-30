import { addDays, addMonths, differenceInCalendarDays, startOfDay } from 'date-fns'
import { type VulnerabilityWhereInput } from '@repo/codegen/src/schema'
import { getVulnerabilitySlaBaseDate, type TVulnerabilityDueDateSource } from '@/utils/vulnerability-due-date'

const SNOOZE_PRESETS = [
  { value: '7d', label: '7 days', until: (now: Date) => addDays(now, 7) },
  { value: '1m', label: '1 month', until: (now: Date) => addMonths(now, 1) },
  { value: '3m', label: '3 months', until: (now: Date) => addMonths(now, 3) },
] as const

export const CUSTOM_SNOOZE = 'custom'

export type TSnoozeOption = (typeof SNOOZE_PRESETS)[number]['value'] | typeof CUSTOM_SNOOZE

export const DEFAULT_SNOOZE_OPTION: TSnoozeOption = '7d'

export const SNOOZE_OPTIONS: { value: TSnoozeOption; label: string }[] = [...SNOOZE_PRESETS.map(({ value, label }) => ({ value, label })), { value: CUSTOM_SNOOZE, label: 'Choose date' }]

export const isSnoozeOption = (value: string): value is TSnoozeOption => SNOOZE_OPTIONS.some((option) => option.value === value)

export const earliestCustomSnoozeDate = (now: Date = new Date()): Date => addDays(startOfDay(now), 1)

export const resolveSnoozeUntil = (option: TSnoozeOption, customDate: Date | null, now: Date = new Date()): Date | null => {
  if (option === CUSTOM_SNOOZE) {
    return customDate && customDate >= earliestCustomSnoozeDate(now) ? customDate : null
  }
  return SNOOZE_PRESETS.find((preset) => preset.value === option)?.until(now) ?? null
}

export type TSnoozeVulnerability = TVulnerabilityDueDateSource & { id: string; cveID?: string | null }

export const matchingCveWhere = (vulnerability: TSnoozeVulnerability): VulnerabilityWhereInput | null =>
  vulnerability.cveID ? { cveIDEqualFold: vulnerability.cveID, open: true, idNEQ: vulnerability.id } : null

export const getSnoozedRemediationSla = (vulnerability: TVulnerabilityDueDateSource, until: Date, currentSlaDays: number | null): number | null => {
  const baseDate = getVulnerabilitySlaBaseDate(vulnerability)
  if (!baseDate) return null

  const snoozedSla = differenceInCalendarDays(until, baseDate)
  return currentSlaDays !== null && snoozedSla <= currentSlaDays ? null : snoozedSla
}
