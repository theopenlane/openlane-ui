import { type FilterField } from '@/types'
import { CampaignCampaignStatus, CampaignCampaignType } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'

export const getCampaignFilterFields = (): FilterField[] => [
  { key: 'nameContainsFold', label: 'Name', type: 'text', icon: FilterIcons.Name },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    options: enumToOptions(CampaignCampaignStatus),
    icon: FilterIcons.Status,
  },
  {
    key: 'campaignTypeIn',
    label: 'Type',
    type: 'multiselect',
    options: enumToOptions(CampaignCampaignType),
    icon: FilterIcons.Type,
  },
  { key: 'dueDate', label: 'Due Date', type: 'dateRange', icon: FilterIcons.Date },
]

export const CAMPAIGN_SORT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'STATUS', label: 'Status' },
  { key: 'CAMPAIGN_TYPE', label: 'Type' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]
