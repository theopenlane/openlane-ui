import { FilterField } from '@/types'
import { useEffect, useState } from 'react'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { FilterIcons, ProcedureStatusFilterOptions } from '@/components/shared/enum-mapper/policy-enum'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'

export function useProceduresFilters(): FilterField[] | null {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()
  const [filters, setFilters] = useState<FilterField[] | null>(null)

  const { enumOptions, isSuccess: isTypesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'procedure',
      field: 'kind',
    },
  })

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
        key: 'procedureKindNameIn',
        label: 'Type',
        type: 'multiselect',
        icon: FilterIcons.Type,
        options: enumOptions,
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
        options: ProcedureStatusFilterOptions,
        icon: FilterIcons.Status,
      },
      {
        key: 'hasControls',
        label: 'Linked Controls',
        type: 'radio',
        radioOptions: [
          { value: true, label: 'Has linked controls' },
          { value: false, label: 'No linked controls' },
        ],
        icon: FilterIcons.LinkedControls,
      },
      {
        key: 'hasPolicies',
        label: 'Linked Policies',
        type: 'radio',
        radioOptions: [
          { value: true, label: 'Has linked policies' },
          { value: false, label: 'No linked policies' },
        ],
        icon: FilterIcons.LinkedControls,
      },
      {
        key: 'hasComments',
        label: 'Has Comments',
        type: 'radio',
        icon: FilterIcons.Comments,
        radioOptions: [
          { value: true, label: 'Has comments' },
          { value: false, label: 'No comments' },
        ],
      },
    ]

    setFilters(newFilters)
  }, [isProgramSuccess, programOptions, isGroupSuccess, groupOptions, filters, enumOptions, isTypesSuccess])
  return filters
}

export const PROCEDURES_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
  },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'updated_at', label: 'Last Updated' },
]
