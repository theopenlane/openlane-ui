import React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { CircleDot, FileBadge2, Folder, FolderTree, Layers, Lock, MoreHorizontal, Pencil, Tag } from 'lucide-react'
import LinkedPoliciesCell from '@/components/shared/linked-policies-cell/linked-policies-cell'
import LinkedEvidenceCell from '@/components/shared/linked-evidence-cell/linked-evidence-cell'
import InheritedBadge from '@/components/shared/inherited-badge/inherited-badge'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { ControlIconMapper16 } from '@/components/shared/enum-mapper/control-enum'
import type { FilterField } from '@/types'
import type { MappedControlRow } from './mapped-controls-types'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { TruncatedCell } from '@repo/ui/data-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type LinkMap = Map<string, string>

const getRefCodeColumn = (controlLinkMap: LinkMap, subcontrolLinkMap: LinkMap): ColumnDef<MappedControlRow> => ({
  accessorKey: 'refCode',
  header: () => <span className="whitespace-nowrap">Ref Code</span>,
  cell: ({ row }) => {
    const href = row.original.nodeType === ObjectTypes.SUBCONTROL ? subcontrolLinkMap.get(row.original.refCode) : controlLinkMap.get(row.original.refCode)
    const inherited = row.original.inheritedFromSubcontrols
    return (
      <div className="flex flex-col gap-1">
        {href ? (
          <Link href={href} className="block truncate text-blue-500 hover:underline">
            {row.original.refCode}
          </Link>
        ) : (
          <span className="block truncate">{row.original.refCode}</span>
        )}
        {inherited && inherited.length > 0 && <InheritedBadge sources={inherited} />}
      </div>
    )
  },
  size: 140,
  minSize: 120,
})

const statusColumn: ColumnDef<MappedControlRow> = {
  accessorKey: 'status',
  header: () => <span className="whitespace-nowrap">Status</span>,
  cell: ({ row }) => {
    const status = row.original.status
    if (!status) return <span>-</span>
    return (
      <div className="flex items-center gap-1.5">
        {ControlIconMapper16[status as ControlControlStatus]}
        <span>{getEnumLabel(status)}</span>
      </div>
    )
  },
  size: 120,
  minSize: 120,
}

const linkedPoliciesColumn: ColumnDef<MappedControlRow> = {
  id: 'linkedPolicies',
  header: () => <span className="whitespace-nowrap">Linked policies</span>,
  cell: ({ row }) => <LinkedPoliciesCell policies={row.original.linkedPolicies} stopPropagation />,
  size: 180,
}

const evidenceColumn: ColumnDef<MappedControlRow> = {
  id: 'evidenceRefs',
  header: () => <span className="whitespace-nowrap">Evidence</span>,
  cell: ({ row }) => <LinkedEvidenceCell evidenceRefs={row.original.evidenceRefs} stopPropagation />,
  size: 180,
}

export const getMappedControlsBaseColumns = (
  controlLinkMap: LinkMap,
  subcontrolLinkMap: LinkMap,
  convertToReadOnly: (value: string, index: number) => React.ReactNode,
): ColumnDef<MappedControlRow>[] => [
  getRefCodeColumn(controlLinkMap, subcontrolLinkMap),
  {
    accessorKey: 'description',
    header: () => <span className="whitespace-nowrap">Description</span>,
    cell: ({ row }) => <TruncatedCell className="line-clamp-2 text-justify whitespace-normal">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</TruncatedCell>,
    size: 320,
  },
  statusColumn,
  {
    accessorKey: 'type',
    header: () => <span className="whitespace-nowrap">Type</span>,
    cell: ({ row }) => <CustomEnumChipCell value={row.original.type} objectType="control" field="kind" />,
    size: 120,
    minSize: 120,
  },
  linkedPoliciesColumn,
  evidenceColumn,
]

export const getOrgControlsColumns = (controlLinkMap: LinkMap, subcontrolLinkMap: LinkMap, convertToReadOnly: (value: string, index: number) => React.ReactNode): ColumnDef<MappedControlRow>[] => [
  getRefCodeColumn(controlLinkMap, subcontrolLinkMap),
  {
    accessorKey: 'description',
    header: () => <span className="whitespace-nowrap">Description</span>,
    cell: ({ row }) => <div className="line-clamp-2 text-justify">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</div>,
    size: 280,
  },
  statusColumn,
  linkedPoliciesColumn,
  evidenceColumn,
]

export const getMappedControlsFrameworkColumns = (baseColumns: ColumnDef<MappedControlRow>[]): ColumnDef<MappedControlRow>[] => [
  ...baseColumns,
  {
    accessorKey: 'referenceFramework',
    header: () => <span className="whitespace-nowrap">Framework</span>,
    cell: ({ row }) => (
      <span className="block truncate">
        {row.original.referenceFramework ? <StandardChip referenceFramework={row.original.referenceFramework} /> : <span className="text-muted-foreground">Custom</span>}
      </span>
    ),
    size: 160,
    minSize: 160,
    maxSize: 160,
  },
]

export const getMappedControlsActionsColumn = (basePath: string, canEdit: boolean): ColumnDef<MappedControlRow> => ({
  id: 'actions',
  header: '',
  size: 50,
  cell: ({ row }) => {
    const ids = row.original.mappedControlReferenceIDs
    if (ids.length === 0) {
      return (
        <div className="flex justify-end">
          <SystemTooltip icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />} content={<p>System-owned mapping</p>} />
        </div>
      )
    }
    if (!canEdit) return null
    return (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {ids.map((id, index) => (
              <DropdownMenuItem asChild key={id}>
                <Link href={`${basePath}/edit-map-control?mappedControlId=${id}`}>
                  <Pencil className="h-4 w-4" />
                  {ids.length > 1 ? `Edit mapping ${index + 1}` : 'Edit mapping'}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  },
})

export const getMappedControlsFilterFields = (rows: MappedControlRow[], showFrameworkFilter: boolean): FilterField[] => {
  const typeOptions = Array.from(new Set(rows.map((row) => row.type).filter(Boolean))).sort() as string[]
  const sourceOptions = Array.from(new Set(rows.map((row) => row.controlSource).filter(Boolean))).sort() as string[]
  const frameworkOptions = Array.from(new Set(rows.map((row) => row.referenceFramework).filter(Boolean))).sort() as string[]

  const fields: FilterField[] = [
    {
      key: 'typeIn',
      label: 'Type',
      type: 'multiselect',
      icon: Tag,
      options: typeOptions.map((value) => ({ value, label: getEnumLabel(value) })),
    },
    {
      key: 'sourceIn',
      label: 'Source',
      type: 'multiselect',
      icon: Layers,
      options: sourceOptions.map((value) => ({ value, label: getEnumLabel(value) })),
    },
    {
      key: 'statusIn',
      label: 'Status',
      type: 'multiselect',
      icon: CircleDot,
      options: enumToOptions(ControlControlStatus),
    },
    {
      key: 'categoryContainsFold',
      label: 'Category',
      type: 'text',
      icon: Folder,
    },
    {
      key: 'subcategoryContainsFold',
      label: 'Subcategory',
      type: 'text',
      icon: FolderTree,
    },
  ]

  if (showFrameworkFilter) {
    fields.push({
      key: 'referenceFrameworkIn',
      label: 'Framework',
      type: 'multiselect',
      icon: FileBadge2,
      options: frameworkOptions.map((framework) => ({ value: framework, label: framework })),
    })
  }

  return fields
}
