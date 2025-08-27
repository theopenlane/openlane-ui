import { FilterField, SelectFilterField, SelectIsFilterField } from '@/types'
import { OrderDirection, ProcedureOrderField } from '@repo/codegen/src/schema.ts'

import { useEffect, useState } from 'react'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { useGroupSelect } from '@/lib/graphql-hooks/groups'
import { ProcedureStatusFilterOptions } from '@/components/shared/enum-mapper/policy-enum'

export function useProceduresFilters(): FilterField[] | null {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()
  const [filters, setFilters] = useState<FilterField[] | null>(null)

  useEffect(() => {
    if (!isProgramSuccess || !isGroupSuccess || filters) return

    const statusOptions = ProcedureStatusFilterOptions

    const newFilters: FilterField[] = [
      {
        key: 'approverID',
        label: 'Approver Group',
        type: 'select',
        options: groupOptions,
      } as SelectFilterField,
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
      } as SelectIsFilterField,
      {
        key: 'hasSubcontrolWith.refCodeContainsFold',
        label: 'Subcontrol',
        type: 'containsText',
      },
      {
        key: 'name',
        label: 'Name',
        type: 'text',
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
      {
        key: 'updatedAt',
        label: 'Last Updated',
        type: 'date',
      },
      {
        key: 'updatedBy',
        label: 'Last Updated By',
        type: 'date',
      },
    ]

    setFilters(newFilters)
  }, [isProgramSuccess, isGroupSuccess, programOptions, groupOptions, filters])

  return filters
}

export const PROCEDURES_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
    default: {
      key: ProcedureOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'updated_by', label: 'Last Updated By' },
  { key: 'updated_at', label: 'Last Updated' },
]
