import { Globe, Tag, Shield, ListFilter, CalendarPlus, History, type LucideIcon } from 'lucide-react'
import { FilterField } from '@/types'
import { OrderDirection, TemplateOrderField, TemplateTemplateKind } from '@repo/codegen/src/schema.ts'

const TemplateFilterIcons = {
  Environment: Globe,
  Kind: ListFilter,
  Scope: Tag,
  SystemOwned: Shield,
  UpdatedAt: CalendarPlus,
  CreatedAt: History,
} satisfies Record<string, LucideIcon>

const KIND_LABEL_MAP: Record<TemplateTemplateKind, string> = {
  [TemplateTemplateKind.QUESTIONNAIRE]: 'Questionnaire',
  [TemplateTemplateKind.TRUSTCENTER_NDA]: 'Trust Center NDA',
}

const kindOptions = Object.values(TemplateTemplateKind).map((kind) => ({
  value: kind,
  label: KIND_LABEL_MAP[kind] ?? kind,
}))

export const TEMPLATE_FILTER_FIELDS: FilterField[] = [
  { key: 'environmentNameContainsFold', label: 'Environment', type: 'text', icon: TemplateFilterIcons.Environment },
  {
    key: 'kindIn',
    label: 'Kind',
    type: 'multiselect',
    icon: TemplateFilterIcons.Kind,
    options: kindOptions,
  },
  { key: 'scopeNameContainsFold', label: 'Scope', type: 'text', icon: TemplateFilterIcons.Scope },
  {
    key: 'systemOwned',
    label: 'System Owned',
    type: 'radio',
    icon: TemplateFilterIcons.SystemOwned,
    radioOptions: [
      { value: true, label: 'System owned' },
      { value: false, label: 'Not system owned' },
    ],
  },
  { key: 'updatedAt', label: 'Updated At', type: 'dateRange', icon: TemplateFilterIcons.UpdatedAt },
  { key: 'createdAt', label: 'Created At', type: 'dateRange', icon: TemplateFilterIcons.CreatedAt },
]

export const TEMPLATE_SORT_FIELDS = [
  {
    key: 'name',
    label: 'Name',
    default: {
      key: TemplateOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
  { key: 'template_type', label: 'Type' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]
