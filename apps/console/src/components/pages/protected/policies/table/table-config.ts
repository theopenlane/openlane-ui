import { InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'

import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { FilterField } from '@/types'
import { useEffect, useState } from 'react'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { FilterIcons, InternalPolicyStatusFilterOptions } from '@/components/shared/enum-mapper/policy-enum'

export function usePoliciesFilters(): FilterField[] | null {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()

  const [filters, setFilters] = useState<FilterField[] | null>(null)

  useEffect(() => {
    if (!isProgramSuccess || !isGroupSuccess || filters) return
    const newFilters: FilterField[] = [
      {
        key: 'approverID',
        label: 'Approver Group',
        type: 'select',
        options: groupOptions,
        icon: FilterIcons.ApproverGroup,
      },
      {
        key: 'hasControlsWith',
        childrenObjectKey: 'refCodeContainsFold',
        forceKeyOperator: true,
        label: 'Control Ref Code',
        type: 'text',
        icon: FilterIcons.Control,
      },
      {
        key: 'hasProgramsWith',
        label: 'Program Name',
        type: 'select',
        forceKeyOperator: true,
        childrenObjectKey: 'id',
        options: programOptions,
        icon: FilterIcons.ProgramName,
      },
      {
        key: 'hasSubcontrolWith',
        childrenObjectKey: 'refCodeContainsFold',
        forceKeyOperator: true,
        label: 'Subcontrol Ref Code',
        type: 'text',
        icon: FilterIcons.Subcontrol,
      },
      {
        key: 'policyType',
        label: 'Type',
        type: 'text',
        icon: FilterIcons.Type,
      },
      {
        key: 'reviewDue',
        label: 'Review Due',
        type: 'dateRange',
        icon: FilterIcons.ReviewDue,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        multiple: true,
        options: InternalPolicyStatusFilterOptions,
        icon: FilterIcons.Status,
      },
    ]

    setFilters(newFilters)
  }, [isProgramSuccess, programOptions, isGroupSuccess, groupOptions, filters])

  return filters
}

export const INTERNAL_POLICIES_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
    default: {
      key: InternalPolicyOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'updated_by', label: 'Last Updated By' },
  { key: 'updated_at', label: 'Last Updated' },
]
