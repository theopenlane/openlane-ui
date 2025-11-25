import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { FilterField } from '@/types'
import { useEffect, useState } from 'react'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { FilterIcons, InternalPolicyStatusFilterOptions } from '@/components/shared/enum-mapper/policy-enum'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'

export function usePoliciesFilters(): FilterField[] | null {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()

  const { enumOptions, isSuccess: isTypesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'internalPolicy',
      field: 'kind',
    },
  })

  const [filters, setFilters] = useState<FilterField[] | null>(null)

  useEffect(() => {
    if (!isProgramSuccess || !isGroupSuccess || !isTypesSuccess || filters) return
    const newFilters: FilterField[] = [
      {
        key: 'approverIDIn',
        label: 'Approver Group',
        type: 'multiselect',
        options: groupOptions,
        icon: FilterIcons.ApproverGroup,
      },
      {
        key: 'hasControlsWith',
        label: 'Control Ref Code',
        type: 'text',
        icon: FilterIcons.Control,
      },
      {
        key: 'hasProgramsWith',
        label: 'Program Name',
        type: 'multiselect',
        options: programOptions,
        icon: FilterIcons.ProgramName,
      },
      {
        key: 'hasSubcontrolsWith',
        label: 'Subcontrol Ref Code',
        type: 'text',
        icon: FilterIcons.Subcontrol,
      },
      {
        key: 'internalPolicyKindNameIn',
        label: 'Type',
        type: 'multiselect',
        icon: FilterIcons.Type,
        options: enumOptions,
      },
      {
        key: 'policyTypeIsNil',
        label: 'Empty Type',
        type: 'boolean',
        icon: FilterIcons.Type,
      },
      {
        key: 'reviewDue',
        label: 'Review Due',
        type: 'dateRange',
        icon: FilterIcons.ReviewDue,
      },
      {
        key: 'statusIn',
        label: 'Status',
        type: 'multiselect',
        options: InternalPolicyStatusFilterOptions,
        icon: FilterIcons.Status,
      },
      {
        key: 'hasControls',
        label: 'Linked Controls',
        type: 'boolean',
        icon: FilterIcons.LinkedControls,
      },
      {
        key: 'hasSubcontrols',
        label: 'Linked Subcontrols',
        type: 'boolean',
        icon: FilterIcons.LinkedControls,
      },
    ]

    setFilters(newFilters)
  }, [isProgramSuccess, programOptions, isGroupSuccess, groupOptions, filters, isTypesSuccess, enumOptions])

  return filters
}

export const INTERNAL_POLICIES_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  { key: 'name', label: 'Name' },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'updated_at', label: 'Last Updated' },
]
