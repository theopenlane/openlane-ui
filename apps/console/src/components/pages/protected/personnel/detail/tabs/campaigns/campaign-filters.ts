import { CampaignCampaignType, CampaignTargetAssessmentResponseStatus, type CampaignTargetWhereInput } from '@repo/codegen/src/schema'
import { defineFilterFields } from '@/types'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'

export const PERSONNEL_CAMPAIGN_REMAPPED_FILTER_KEYS = ['campaignTypeIn'] as const

export const PERSONNEL_CAMPAIGN_FILTER_FIELDS = defineFilterFields<CampaignTargetWhereInput, (typeof PERSONNEL_CAMPAIGN_REMAPPED_FILTER_KEYS)[number]>()([
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: enumToOptions(CampaignTargetAssessmentResponseStatus),
  },
  {
    key: 'campaignTypeIn',
    label: 'Campaign Type',
    type: 'multiselect',
    icon: FilterIcons.Type,
    options: enumToOptions(CampaignCampaignType),
  },
  { key: 'completedAt', label: 'Completed At', type: 'dateRange', icon: FilterIcons.Date },
  { key: 'sentAt', label: 'Sent At', type: 'dateRange', icon: FilterIcons.Date },
])

export const mapPersonnelCampaignFilterKey = (key: string, value: unknown): CampaignTargetWhereInput => {
  if (PERSONNEL_CAMPAIGN_REMAPPED_FILTER_KEYS.some((remapped) => remapped === key)) {
    return { hasCampaignWith: [{ [key]: value }] }
  }

  return { [key]: value }
}

export const campaignNameSearchWhere = (term: string): CampaignTargetWhereInput => ({ hasCampaignWith: [{ nameContainsFold: term }] })
