import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { FilterField } from '@/types'
import { useEffect, useMemo, useState } from 'react'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { FilterIcons, InternalPolicyStatusFilterOptions } from '@/components/shared/enum-mapper/policy-enum'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { useGetTags } from '@/lib/graphql-hooks/tags'

export function usePoliciesFilters(): FilterField[] | null {
  const { programOptions, isSuccess: isProgramSuccess } = useProgramSelect({})
  const { groupOptions, isSuccess: isGroupSuccess } = useGroupSelect()

  const { enumOptions, isSuccess: isTypesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'internal_policy',
      field: 'kind',
    },
  })

  const { tagOptions: rawTagOptions } = useGetTags()
  const tagOptions = useMemo(() => rawTagOptions ?? [], [rawTagOptions])

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
        icon: FilterIcons.LinkedControls,
        type: 'radio',
        radioOptions: [
          { value: true, label: 'Has linked controls' },
          { value: false, label: 'No linked controls' },
        ],
      },
      {
        key: 'hasSubcontrols',
        label: 'Linked Subcontrols',
        type: 'radio',
        radioOptions: [
          { value: true, label: 'Has linked subcontrols' },
          { value: false, label: 'No linked subcontrols' },
        ],
        icon: FilterIcons.LinkedControls,
      },
      {
        key: 'hasProcedures',
        label: 'Linked Procedures',
        type: 'radio',
        radioOptions: [
          { value: true, label: 'Has linked procedures' },
          { value: false, label: 'No linked procedures' },
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
      {
        key: 'tagsHas',
        label: 'Tags',
        type: 'dropdownSearchSingleSelect',
        icon: FilterIcons.Status,
        options: tagOptions,
      },
    ]

    setFilters(newFilters)
  }, [isProgramSuccess, programOptions, isGroupSuccess, groupOptions, filters, isTypesSuccess, enumOptions, tagOptions])

  return filters
}

export const INTERNAL_POLICIES_SORT_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  { key: 'name', label: 'Name' },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'updated_at', label: 'Last Updated' },
]
