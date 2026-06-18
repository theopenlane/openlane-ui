import React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { FileBadge2, Folder, FolderTree, Layers, Link2, MoreHorizontal, Pencil, Tag } from 'lucide-react'
import InheritedBadge from '@/components/shared/inherited-badge/inherited-badge'
import LinkedPoliciesCell from '@/components/shared/linked-policies-cell/linked-policies-cell'
import LinkedEvidenceCell from '@/components/shared/linked-evidence-cell/linked-evidence-cell'
import { type ControlControlStatus, MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import { ControlIconMapper16 } from '@/components/shared/enum-mapper/control-enum'
import type { FilterField } from '@/types'
import type { MappedControlRow, SatisfiesTarget } from './mapped-controls-types'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { TruncatedCell } from '@repo/ui/data-table'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const SatisfiesTag: React.FC<{ target: SatisfiesTarget }> = ({ target }) => (
  <ControlChip
    control={{
      __typename: target.level === 'subcontrol' ? ObjectTypes.SUBCONTROL : ObjectTypes.CONTROL,
      id: target.id,
      refCode: target.refCode,
      referenceFramework: target.referenceFramework,
      controlID: target.controlID,
    }}
    hideStandard
  />
)

type LinkMap = Map<string, string>

export const getMappedControlsBaseColumns = (
  controlLinkMap: LinkMap,
  subcontrolLinkMap: LinkMap,
  convertToReadOnly: (value: string, index: number) => React.ReactNode,
): ColumnDef<MappedControlRow>[] => [
  {
    accessorKey: 'refCode',
    header: () => <span className="whitespace-nowrap">Ref Code</span>,
    cell: ({ row }) => {
      const href = row.original.nodeType === ObjectTypes.SUBCONTROL ? subcontrolLinkMap.get(row.original.refCode) : controlLinkMap.get(row.original.refCode)
      if (!href) return <span className="block truncate">{row.original.refCode}</span>
      return (
        <Link href={href} className="block truncate text-blue-500 hover:underline">
          {row.original.refCode}
        </Link>
      )
    },
    size: 140,
    minSize: 120,
  },
  {
    accessorKey: 'description',
    header: () => <span className="whitespace-nowrap">Description</span>,
    cell: ({ row }) => <TruncatedCell className="line-clamp-2 text-justify whitespace-normal">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</TruncatedCell>,
    size: 320,
  },
  {
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
  },
  {
    accessorKey: 'type',
    header: () => <span className="whitespace-nowrap">Type</span>,
    cell: ({ row }) => <CustomEnumChipCell value={row.original.type} objectType="control" field="kind" />,
    size: 120,
    minSize: 120,
  },
  {
    id: 'linkedPolicies',
    header: () => <span className="whitespace-nowrap">Linked policies</span>,
    cell: ({ row }) => <LinkedPoliciesCell policies={row.original.linkedPolicies} stopPropagation />,
    size: 180,
  },
  {
    id: 'evidenceRefs',
    header: () => <span className="whitespace-nowrap">Evidence</span>,
    cell: ({ row }) => <LinkedEvidenceCell evidenceRefs={row.original.evidenceRefs} stopPropagation />,
    size: 180,
  },
]

export const getOrgControlsColumns = (controlLinkMap: LinkMap, subcontrolLinkMap: LinkMap, convertToReadOnly: (value: string, index: number) => React.ReactNode): ColumnDef<MappedControlRow>[] => [
  {
    accessorKey: 'refCode',
    header: () => <span className="whitespace-nowrap">Ref Code</span>,
    cell: ({ row }) => {
      const href = controlLinkMap.get(row.original.refCode)
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
          {inherited && inherited.length > 0 && <InheritedBadge sources={inherited.map((s) => ({ refCode: s.refCode, href: subcontrolLinkMap.get(s.refCode) }))} />}
        </div>
      )
    },
    size: 140,
    minSize: 120,
  },
  {
    accessorKey: 'description',
    header: () => <span className="whitespace-nowrap">Description</span>,
    cell: ({ row }) => <div className="line-clamp-2 text-justify">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</div>,
    size: 280,
  },
  {
    id: 'satisfies',
    header: () => <span className="whitespace-nowrap">Satisfies</span>,
    cell: ({ row }) => {
      const targets = row.original.satisfiesTargets
      if (!targets || targets.length === 0) return <span className="text-muted-foreground">-</span>
      return (
        <div className="flex flex-col items-start justify-center gap-1 h-full">
          {targets.map((t) => (
            <SatisfiesTag key={`${t.level}-${t.refCode}`} target={t} />
          ))}
        </div>
      )
    },
    size: 130,
    minSize: 100,
  },
  {
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
  },
  {
    id: 'linkedPolicies',
    header: () => <span className="whitespace-nowrap">Linked policies</span>,
    cell: ({ row }) => <LinkedPoliciesCell policies={row.original.linkedPolicies} stopPropagation />,
    size: 180,
  },
  {
    id: 'evidenceRefs',
    header: () => <span className="whitespace-nowrap">Evidence</span>,
    cell: ({ row }) => <LinkedEvidenceCell evidenceRefs={row.original.evidenceRefs} stopPropagation />,
    size: 180,
  },
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

export const getMappedControlsActionsColumn = (basePath: string): ColumnDef<MappedControlRow> => ({
  id: 'actions',
  header: '',
  size: 50,
  cell: ({ row }) => {
    if (row.original.isSystemOwnedMapping) return null
    const href = `${basePath}/edit-map-control?mappedControlId=${row.original.mappedControlId}`
    return (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem asChild>
              <Link href={href}>
                <Pencil className="h-4 w-4" />
                Edit Mapping
              </Link>
            </DropdownMenuItem>
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
    {
      key: 'mappingTypeIn',
      label: 'Mapping Type',
      type: 'multiselect',
      icon: Link2,
      options: Object.values(MappedControlMappingType).map((value) => ({ value, label: getEnumLabel(value) })),
    },
    {
      key: 'mappingSourceIn',
      label: 'Mapping Source',
      type: 'multiselect',
      icon: Layers,
      options: Object.values(MappedControlMappingSource).map((value) => ({ value, label: getEnumLabel(value) })),
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
