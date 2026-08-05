import { type CampaignFrequency, EntityFrequency } from '@repo/codegen/src/schema'

const FREQUENCY_MONTHS: Record<`${EntityFrequency}`, number | null> = {
  [EntityFrequency.MONTHLY]: 1,
  [EntityFrequency.QUARTERLY]: 3,
  [EntityFrequency.BIANNUALLY]: 6,
  [EntityFrequency.YEARLY]: 12,
  [EntityFrequency.BIENNIALLY]: 24,
  [EntityFrequency.TRIENNIALLY]: 36,
  [EntityFrequency.NONE]: null,
}

export const frequencyToMonths = (frequency: EntityFrequency | CampaignFrequency | null | undefined): number | null => (frequency ? FREQUENCY_MONTHS[frequency] : null)
