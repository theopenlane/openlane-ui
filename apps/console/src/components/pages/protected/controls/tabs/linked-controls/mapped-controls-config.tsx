import React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { FileBadge2, Folder, FolderTree, Layers, Link2, Tag } from 'lucide-react'
import { formatEnumLabel } from '@/utils/enumToLabel'
import { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import type { FilterField } from '@/types'
import type { MappedControlRow } from './mapped-controls-types'

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
      const href = row.original.nodeType === 'Subcontrol' ? subcontrolLinkMap.get(row.original.refCode) : controlLinkMap.get(row.original.refCode)
      if (!href) return <span className="block whitespace-nowrap">{row.original.refCode}</span>
      return (
        <Link href={href} className="block whitespace-nowrap text-blue-500 hover:underline">
          {row.original.refCode}
        </Link>
      )
    },
    size: 90,
    minSize: 90,
    maxSize: 90,
  },
  {
    accessorKey: 'description',
    header: () => <span className="whitespace-nowrap">Description</span>,
    cell: ({ row }) => <div className="line-clamp-2 text-justify">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</div>,
    size: 500,
  },
  {
    accessorKey: 'status',
    header: () => <span className="whitespace-nowrap">Status</span>,
    cell: ({ row }) => (row.original.status ? formatEnumLabel(row.original.status) : '-'),
    size: 120,
    minSize: 120,
    maxSize: 120,
  },
  {
    accessorKey: 'type',
    header: () => <span className="whitespace-nowrap">Type</span>,
    cell: ({ row }) => (row.original.type ? formatEnumLabel(row.original.type) : '-'),
    size: 120,
    minSize: 120,
    maxSize: 120,
  },
]

export const getMappedControlsFrameworkColumns = (baseColumns: ColumnDef<MappedControlRow>[]): ColumnDef<MappedControlRow>[] => [
  ...baseColumns,
  {
    accessorKey: 'referenceFramework',
    header: () => <span className="whitespace-nowrap">Framework</span>,
    cell: ({ row }) => (row.original.referenceFramework ? <StandardChip referenceFramework={row.original.referenceFramework} /> : <span className="text-muted-foreground">Custom</span>),
    size: 160,
    minSize: 160,
    maxSize: 160,
  },
]

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
      options: typeOptions.map((value) => ({ value, label: formatEnumLabel(value) })),
    },
    {
      key: 'sourceIn',
      label: 'Source',
      type: 'multiselect',
      icon: Layers,
      options: sourceOptions.map((value) => ({ value, label: formatEnumLabel(value) })),
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
      options: Object.values(MappedControlMappingType).map((value) => ({ value, label: formatEnumLabel(value) })),
    },
    {
      key: 'mappingSourceIn',
      label: 'Mapping Source',
      type: 'multiselect',
      icon: Layers,
      options: Object.values(MappedControlMappingSource).map((value) => ({ value, label: formatEnumLabel(value) })),
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
