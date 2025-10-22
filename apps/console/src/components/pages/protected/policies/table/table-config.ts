import { InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'

import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { FilterField } from '@/types'
import { useEffect, useState } from 'react'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { InternalPolicyStatusFilterOptions } from '@/components/shared/enum-mapper/policy-enum'
import { Calendar, FileText, Tags, UserRound } from 'lucide-react'

export function usePoliciesFilters(): FilterField[] | null {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()

  const [filters, setFilters] = useState<FilterField[] | null>(null)

  useEffect(() => {
    if (!isProgramSuccess || !isGroupSuccess || filters) return
    const newFilters: FilterField[] = [
      {
        key: 'approverIDIn',
        label: 'Approver Group',
        type: 'multiselect',
        options: groupOptions,
        icon: UserRound,
      },
      {
        key: 'hasControlsWith',
        childrenObjectKey: 'refCodeContainsFold',
        forceKeyOperator: true,
        label: 'Control',
        type: 'text',
        icon: FileText,
      },
      {
        key: 'hasProgramsWith',
        label: 'Program Name',
        type: 'select',
        forceKeyOperator: true,
        childrenObjectKey: 'id',
        options: programOptions,
        icon: FileText,
      },
      {
        key: 'hasSubcontrolWith',
        childrenObjectKey: 'refCodeContainsFold',
        forceKeyOperator: true,
        label: 'Subcontrol',
        type: 'text',
        icon: FileText,
      },
      {
        key: 'policyType',
        label: 'Policy Type',
        type: 'text',
        icon: Tags,
      },
      {
        key: 'reviewDue',
        label: 'Review Due',
        type: 'date',
        icon: Calendar,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: InternalPolicyStatusFilterOptions,
        icon: Tags,
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
