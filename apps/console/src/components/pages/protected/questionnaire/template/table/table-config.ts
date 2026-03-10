import { Globe, Tag, Shield, CalendarPlus, History, type LucideIcon } from 'lucide-react'
import { type FilterField } from '@/types'
import { OrderDirection, TemplateOrderField } from '@repo/codegen/src/schema.ts'
import { useMemo } from 'react'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'

const TemplateFilterIcons = {
  Environment: Globe,
  Scope: Tag,
  SystemOwned: Shield,
  UpdatedAt: CalendarPlus,
  CreatedAt: History,
} satisfies Record<string, LucideIcon>

export function useTemplateFilters(): FilterField[] | undefined {
  const { data: environmentData, isSuccess: isEnvironmentSuccess } = useGetCustomTypeEnums({
    where: { objectType: 'global', field: 'environment' },
  })

  const { data: scopeData, isSuccess: isScopeSuccess } = useGetCustomTypeEnums({
    where: { objectType: 'global', field: 'scope' },
  })

  return useMemo(() => {
    if (!isEnvironmentSuccess || !isScopeSuccess) return undefined

    const environmentOptions = environmentData?.customTypeEnums?.edges?.map((edge) => ({ value: edge?.node?.name ?? '', label: edge?.node?.name ?? '' })).filter((o) => o.value) ?? []
    const scopeOptions = scopeData?.customTypeEnums?.edges?.map((edge) => ({ value: edge?.node?.name ?? '', label: edge?.node?.name ?? '' })).filter((o) => o.value) ?? []

    return [
      { key: 'environmentNameIn', label: 'Environment', type: 'multiselect', icon: TemplateFilterIcons.Environment, options: environmentOptions },
      { key: 'scopeNameIn', label: 'Scope', type: 'multiselect', icon: TemplateFilterIcons.Scope, options: scopeOptions },
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
    ] satisfies FilterField[]
  }, [isEnvironmentSuccess, isScopeSuccess, environmentData, scopeData])
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
