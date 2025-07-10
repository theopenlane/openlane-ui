import { InternalPolicyDocumentStatus, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'

import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { FilterField } from '@/types'
import { useEffect, useState } from 'react'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'

export function usePoliciesFilters(): FilterField[] | null {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect()
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()

  const [filters, setFilters] = useState<FilterField[] | null>(null)

  useEffect(() => {
    if (!isProgramSuccess || !isGroupSuccess || filters) return
    const statusOptions = Object.entries(InternalPolicyDocumentStatus).map(([key, value]) => ({
      label: key
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    }))
    const newFilters: FilterField[] = [
      {
        key: 'approverID',
        label: 'Approver Group',
        type: 'select',
        options: groupOptions,
      },
      {
        key: 'hasControlWith.refCodeContainsFold',
        label: 'Control',
        type: 'containsText',
      },
      {
        key: 'hasProgramsWith',
        label: 'Program Name',
        type: 'selectIs',
        options: programOptions,
      },
      {
        key: 'hasSubcontrolWith.refCodeContainsFold',
        label: 'Subcontrol',
        type: 'containsText',
      },
      {
        key: 'policyType',
        label: 'Policy Type',
        type: 'text',
      },
      {
        key: 'reviewDue',
        label: 'Review Due',
        type: 'date',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOptions,
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
