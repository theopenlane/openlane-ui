import { FilterField } from '@/types'
import { ControlControlStatus, ControlListFieldsFragment, ControlOrderField, Group, User } from '@repo/codegen/src/schema.ts'
import { ColumnDef, Row } from '@tanstack/react-table'
import SubcontrolCell from './subcontrol-cell'
import { Avatar } from '@/components/shared/avatar/avatar'
import { formatDate } from '@/utils/date'
import { ControlIconMapper16, ControlStatusLabels, ControlStatusTooltips, ControlStatusFilterOptions, FilterIcons } from '@/components/shared/enum-mapper/control-enum'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'
import StandardChip from '../../standards/shared/standard-chip'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import OwnerCell from './owner-cell'
import DelegateCell from './delegate-cell'
import { FileQuestion, LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { LinkedPoliciesCell } from './linked-policies-cell'
import { LinkedProceduresCell } from './linked-procedures-cell'
import AssociatedObjectsCell from './associated-objects-cell'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enums'

export const getControlsFilterFields = (
  standardOptions: { value: string; label: string }[],
  groups: { value: string; label: string }[],
  programOptions: { value: string; label: string }[],
  typeOptions: { value: string; label: string }[],
): FilterField[] => [
  { key: 'refCodeContainsFold', label: 'RefCode', type: 'text', icon: FilterIcons.RefCode },
  { key: 'categoryContainsFold', label: 'Category', type: 'text', icon: FilterIcons.Category },
  { key: 'subcategoryContainsFold', label: 'Subcategory', type: 'text', icon: FilterIcons.Subcategory },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    options: ControlStatusFilterOptions,
    icon: FilterIcons.Status,
  },
  {
    key: 'standardIDIn',
    label: 'Standard',
    type: 'multiselect',
    options: [
      ...standardOptions,
      {
        value: 'CUSTOM',
        label: 'CUSTOM',
      },
    ],
    icon: FileQuestion,
  },
  {
    key: 'controlOwnerIDIn',
    label: 'Owner',
    type: 'multiselect',
    options: groups.map((group) => ({
      value: group.value,
      label: group.label,
    })),
    icon: FilterIcons.Owners,
  },
  {
    key: 'hasProgramsWith',
    label: 'Program Name',
    type: 'multiselect',
    options: programOptions,
    icon: FilterIcons.ProgramName,
  },
  {
    key: 'controlKindNameIn',
    label: 'Control Type',
    type: 'multiselect',
    options: typeOptions,
    icon: FilterIcons.Type,
  },
  {
    key: 'hasInternalPolicies',
    label: 'Linked Policies',
    type: 'radio',
    icon: FilterIcons.LinkedPolicies,
    radioOptions: [
      { value: true, label: 'Has linked policies' },
      { value: false, label: 'No linked policies' },
    ],
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

export const CONTROLS_SORT_FIELDS = [
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
  { key: 'STATUS', label: 'Status' },
  { key: 'SOURCE', label: 'Source' },
  { key: 'CONTROL_TYPE', label: 'Control Type' },
  { key: 'category', label: 'Category' },
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'CONTROL_OWNER_name', label: 'Owner' },
  { key: 'DELEGATE_name', label: 'Delegate' },
  { key: 'ref_code', label: 'Ref' },
]

type Params = {
  convertToReadOnly: (value: string, depth: number) => React.ReactNode
  userMap: Record<string, User>
  selectedControls: { id: string; refCode: string }[]
  setSelectedControls: React.Dispatch<React.SetStateAction<{ id: string; refCode: string }[]>>
  enumOptions: CustomTypeEnumOption[]
}

export const getControlColumns = ({ convertToReadOnly, userMap, selectedControls, setSelectedControls, enumOptions }: Params): ColumnDef<ControlListFieldsFragment>[] => {
  const toggleSelection = (control: { id: string; refCode: string }) => {
    setSelectedControls((prev) => {
      const exists = prev.some((c) => c.id === control.id)
      return exists ? prev.filter((c) => c.id !== control.id) : [...prev, control]
    })
  }
  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageControls = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageControls.every((control) => selectedControls.some((sc) => sc.id === control.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedControls.filter((sc) => !currentPageControls.some((c) => c.id === sc.id)), ...currentPageControls.map((c) => ({ id: c.id, refCode: c.refCode }))]
                  : selectedControls.filter((sc) => !currentPageControls.some((c) => c.id === sc.id))

                setSelectedControls(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<ControlListFieldsFragment> }) => {
        const { id, refCode } = row.original
        const isChecked = selectedControls.some((c) => c.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id, refCode })} />
          </div>
        )
      },
      size: 50,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      size: 120,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div>,
    },
    {
      header: 'Name',
      accessorKey: 'refCode',
      cell: ({ row }) => <div className="font-bold">{row.getValue('refCode')}</div>,
      size: 90,
      minSize: 90,
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => {
        const referenceFramework = row.original.referenceFramework
        const description = convertToReadOnly(row.getValue('description') as string, 0)

        return (
          <div>
            <div className="line-clamp-3 text-justify">{description}</div>
            <div className="mt-2 border-t border-dotted pt-2 flex flex-wrap gap-2">
              <StandardChip referenceFramework={referenceFramework ?? ''} />
              {row.original.category && <Badge variant={'outline'}>{row.original.category}</Badge>}
              {row.original.subcategory && <Badge variant={'outline'}>{row.original.subcategory}</Badge>}
            </div>
          </div>
        )
      },
      size: 400,
      minSize: 300,
      meta: {
        className: 'w-[50%] min-w-[300px]',
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      size: 160,
      cell: ({ row }) => {
        const value: ControlControlStatus = row.getValue('status')
        const label = ControlStatusLabels[value] ?? value
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2 cursor-help">
                  {ControlIconMapper16[value]}
                  <p>{label}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>{ControlStatusTooltips[value]}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      header: 'Category',
      accessorKey: 'category',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('category') || '-'}</div>,
    },
    {
      header: 'Subcategory',
      accessorKey: 'subcategory',
      cell: ({ row }) => <div>{row.getValue('subcategory') || '-'}</div>,
    },
    {
      header: 'Owner',
      accessorKey: ControlOrderField.CONTROL_OWNER_name,
      meta: {
        exportPrefix: 'controlOwner.name',
      },
      cell: ({ row }) => {
        const owner = row.original.controlOwner
        const controlId = row.original.id
        return <OwnerCell owner={owner as Group | null} controlId={controlId} />
      },
      size: 120,
    },
    {
      header: 'Reference ID',
      accessorKey: 'referenceID',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('referenceID') || '-'}</div>,
    },
    {
      header: 'Auditor Reference ID',
      accessorKey: 'auditorReferenceID',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('auditorReferenceID') || '-'}</div>,
    },
    {
      header: 'Source',
      accessorKey: 'source',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('source') || '-'}</div>,
    },
    {
      header: 'Control Type',
      accessorKey: 'controlKindName',
      size: 120,
      cell: ({ row }) => (
        <div>
          <CustomTypeEnumValue value={row.getValue('controlKindName') || ''} options={enumOptions} placeholder="-" />
        </div>
      ),
    },
    {
      header: 'Reference Framework',
      accessorKey: 'referenceFramework',
      size: 120,
      cell: ({ row }) => <div>{row.getValue('referenceFramework') || '-'}</div>,
    },
    {
      header: 'Subcontrols',
      accessorKey: 'subcontrol',
      meta: {
        exportPrefix: 'subcontrols.refCode',
      },
      size: 200,
      cell: SubcontrolCell,
    },
    {
      header: 'Delegate',
      accessorKey: ControlOrderField.DELEGATE_name,
      meta: {
        exportPrefix: 'delegate.name',
      },
      cell: ({ row }) => {
        const delegate = row.original.delegate
        const controlId = row.original.id
        return <DelegateCell delegate={delegate as Group | null} controlId={controlId} />
      },
    },
    {
      header: 'Created By',
      accessorKey: 'createdBy',
      size: 160,
      cell: ({ row }) => {
        const user = userMap[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-6 h-6" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      size: 130,
      cell: ({ cell }) => formatDate(cell.getValue() as string),
    },
    {
      header: 'Updated By',
      accessorKey: 'updatedBy',
      size: 160,
      cell: ({ row }) => {
        const user = userMap[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-6 h-6" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    {
      header: 'Updated At',
      accessorKey: 'updatedAt',
      size: 130,
      cell: ({ cell }) => formatDate(cell.getValue() as string),
    },
    {
      header: 'Desired Outcome',
      accessorKey: 'desiredOutcome',
      meta: {
        exportPrefix: 'controlObjectives.desiredOutcome',
      },
      cell: ({ row }) => {
        const desiredOutcome = row.original.controlObjectives?.edges?.[0]?.node?.desiredOutcome ?? '-'
        return (
          <div className="flex items-center gap-2">
            <span>{convertToReadOnly(desiredOutcome as string, 0)}</span>
          </div>
        )
      },
    },
    {
      header: 'Implementation Details',
      accessorKey: 'controlImplementationsDetails',
      meta: {
        exportPrefix: 'controlImplementations.details',
      },
      cell: ({ row }) => {
        const controlImplementationsDetails = row.original.controlImplementations?.edges?.[0]?.node?.details ?? '-'
        return (
          <div className="flex items-center gap-2">
            <span>{convertToReadOnly(controlImplementationsDetails as string, 0)}</span>
          </div>
        )
      },
    },
    {
      header: 'Associated Objects',
      accessorKey: 'associatedObjects',
      cell: ({ row }) => <AssociatedObjectsCell control={row.original} />,
      minSize: 180,
    },
    {
      header: 'Comments',
      accessorKey: 'comments',
      meta: {
        exportPrefix: 'comments.text',
      },
      cell: ({ row }) => {
        return (
          <Link onClick={(e) => e.stopPropagation()} href={`/controls/${row.original.id}?showComments=true`} className="flex items-center gap-2">
            <Badge>
              {row.original.comments?.totalCount ?? 0} Comments <LinkIcon size={12} className="ml-1 inline-block" />
            </Badge>
          </Link>
        )
      },
      minSize: 120,
    },
    {
      header: 'Linked Policies',
      accessorKey: 'linkedPolicies',
      meta: {
        exportPrefix: 'internalPolicies.name',
      },
      size: 220,
      cell: LinkedPoliciesCell,
    },
    {
      header: 'Linked Procedures',
      accessorKey: 'linkedProcedures',
      meta: {
        exportPrefix: 'procedures.name',
      },
      size: 220,
      cell: LinkedProceduresCell,
    },
  ]
}
