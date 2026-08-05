import { type Campaign, CampaignFrequency, type UpdateCampaignInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { frequencyToMonths } from '@/components/shared/enum-mapper/frequency'

export type CampaignRecurrenceValues = {
  isRecurring: boolean
  frequency: CampaignFrequency
  interval: number
  timezone: string
  endAt: Date | null
}

export type CampaignRecurrenceSource = Pick<Campaign, 'isRecurring' | 'recurrenceFrequency' | 'recurrenceInterval' | 'recurrenceTimezone' | 'recurrenceEndAt'>

export const SUPPORTED_RECURRENCE_FREQUENCIES = [CampaignFrequency.MONTHLY, CampaignFrequency.QUARTERLY, CampaignFrequency.BIANNUALLY, CampaignFrequency.YEARLY]

let cachedDefaultTimezone: string | undefined

const getDefaultTimezone = (): string => (cachedDefaultTimezone ??= Intl.DateTimeFormat().resolvedOptions().timeZone)

export const toRecurrenceValues = (campaign: CampaignRecurrenceSource | null | undefined): CampaignRecurrenceValues => ({
  isRecurring: !!campaign?.isRecurring,
  frequency: campaign?.recurrenceFrequency && campaign.recurrenceFrequency !== CampaignFrequency.NONE ? campaign.recurrenceFrequency : CampaignFrequency.MONTHLY,
  interval: campaign?.recurrenceInterval && campaign.recurrenceInterval > 0 ? campaign.recurrenceInterval : 1,
  timezone: campaign?.recurrenceTimezone || getDefaultTimezone(),
  endAt: campaign?.recurrenceEndAt ? new Date(campaign.recurrenceEndAt) : null,
})

export const buildRecurrenceUpdateInput = (values: CampaignRecurrenceValues): UpdateCampaignInput =>
  values.isRecurring
    ? {
        isRecurring: true,
        recurrenceFrequency: values.frequency,
        recurrenceInterval: values.interval,
        recurrenceTimezone: values.timezone,
        ...(values.endAt ? { recurrenceEndAt: values.endAt.toISOString() } : { clearRecurrenceEndAt: true }),
      }
    : { isRecurring: false }

export const describeRecurrence = (values: Pick<CampaignRecurrenceValues, 'isRecurring' | 'frequency' | 'interval'>): string => {
  if (!values.isRecurring || values.frequency === CampaignFrequency.NONE) return 'Does not repeat'

  const monthsPerCycle = frequencyToMonths(values.frequency)
  if (!monthsPerCycle) return getEnumLabel(values.frequency)

  const totalMonths = monthsPerCycle * Math.max(values.interval, 1)
  if (totalMonths % 12 === 0) {
    const years = totalMonths / 12
    return years === 1 ? 'Every year' : `Every ${years} years`
  }

  return totalMonths === 1 ? 'Every month' : `Every ${totalMonths} months`
}

export const describeCampaignRecurrence = (campaign: CampaignRecurrenceSource): string =>
  describeRecurrence({
    isRecurring: campaign.isRecurring,
    frequency: campaign.recurrenceFrequency ?? CampaignFrequency.NONE,
    interval: campaign.recurrenceInterval && campaign.recurrenceInterval > 0 ? campaign.recurrenceInterval : 1,
  })
