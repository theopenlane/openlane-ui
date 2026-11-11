import { Globe, Tag, Shield, CalendarPlus, History, type LucideIcon } from 'lucide-react'
import { defineFilterFields, type FilterField } from '@/types'
import { OrderDirection, TemplateOrderField, type TemplateWhereInput } from '@repo/codegen/src/schema.ts'
import { useMemo } from 'react'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'

const TemplateFilterIcons = {
  Environment: Globe,
  Scope: Tag,
  SystemOwned: Shield,
  UpdatedAt: CalendarPlus,
  CreatedAt: History,
} satisfies Record<string, LucideIcon>

type TOption = { value: string; label: string }

export const getTemplateFilterFields = (environmentOptions: TOption[], scopeOptions: TOption[]) =>
  defineFilterFields<TemplateWhereInput>()([
    { key: 'environmentNameIn', label: 'Environment', type: 'multiselect', icon: TemplateFilterIcons.Environment, options: environmentOptions, nullableKey: 'environmentName' },
    { key: 'scopeNameIn', label: 'Scope', type: 'multiselect', icon: TemplateFilterIcons.Scope, options: scopeOptions, nullableKey: 'scopeName' },
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
  ])

export const useTemplateFilters = (): FilterField[] | undefined => {
  const { enumOptions: environmentEnumOptions, isSuccess: isEnvironmentSuccess } = useGetCustomTypeEnums({
    where: { objectType: null, field: 'environment' },
  })

  const { enumOptions: scopeEnumOptions, isSuccess: isScopeSuccess } = useGetCustomTypeEnums({
    where: { objectType: null, field: 'scope' },
  })

  return useMemo(() => {
    if (!isEnvironmentSuccess || !isScopeSuccess) return undefined

    return getTemplateFilterFields(environmentEnumOptions, scopeEnumOptions)
  }, [isEnvironmentSuccess, isScopeSuccess, environmentEnumOptions, scopeEnumOptions])
}

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
