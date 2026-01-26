'use client'
import { ColumnDef, Row } from '@tanstack/react-table'
import { formatDate } from '@/utils/date'
import { OrderDirection, TrustCenterDocOrderField, TrustCenterDocTrustCenterDocumentVisibility, TrustCenterDocWatermarkStatus } from '@repo/codegen/src/schema'

type GqlFile = {
  presignedURL?: string | null
}
export type TTrustCenterDoc = {
  id: string
  title: string
  category: string
  visibility: string
  tags?: string[] | null
  createdAt: string
  updatedAt: string
  watermarkingEnabled?: boolean
  file?: GqlFile | null
  originalFile?: GqlFile | null
  watermarkStatus: TrustCenterDocWatermarkStatus
  standardShortName: string
}

type Params = {
  selectedDocs: { id: string }[]
  setSelectedDocs: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getTrustCenterDocColumns = ({ selectedDocs, setSelectedDocs }: Params) => {
  const toggleSelection = (doc: { id: string }) => {
    setSelectedDocs((prev) => {
      const exists = prev.some((d) => d.id === doc.id)
      return exists ? prev.filter((d) => d.id !== doc.id) : [...prev, doc]
    })
  }

  const columns: ColumnDef<TTrustCenterDoc>[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageDocs = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageDocs.every((doc) => selectedDocs.some((sd) => sd.id === doc.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedDocs.filter((sd) => !currentPageDocs.some((d) => d.id === sd.id)), ...currentPageDocs.map((d) => ({ id: d.id }))]
                  : selectedDocs.filter((sd) => !currentPageDocs.some((d) => d.id === sd.id))
                setSelectedDocs(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<TTrustCenterDoc> }) => {
        const { id } = row.original
        const isChecked = selectedDocs.some((d) => d.id === id)
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 20,
    },
    {
      accessorKey: 'title',
      header: 'Title',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'visibility',
      header: 'Visibility',
      cell: ({ row }) => {
        return (
          <div className="inline-flex items-center gap-1 justify-center rounded-sm text-document-chip bg-homepage-card-item-transparent border border-switch-bg-inactive h-5 py-2 px-1.5 font-normal text-xs leading-4">
            {row.original.visibility.split('_').join(' ').toLowerCase()}
          </div>
        )
      },
      size: 100,
    },
    {
      accessorKey: 'watermarkingEnabled',
      header: 'Watermarking',
      cell: ({ row }) => {
        return <DocumentsWatermarkStatusChip status={row.original.watermarkStatus} />
      },
      size: 100,
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => {
        const tags = row?.original?.tags
        if (!tags?.length) {
          return '-'
        }
        return <div className="flex gap-2">{row?.original?.tags?.map((tag, i) => <TagChip key={i} tag={tag} />)}</div>
      },
    },
    {
      accessorKey: 'standard',
      header: 'Standard',
      cell: ({ row }) => {
        return row.original.standardShortName ? <StandardChip referenceFramework={row.original.standardShortName} /> : '-'
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.updatedAt)}</span>,
      size: 140,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const presignedURL = row.original.file?.presignedURL || row.original.originalFile?.presignedURL || ''
        return <DocumentActions filePresignedURL={presignedURL} watermarkEnabled={row.original.watermarkingEnabled ?? false} documentId={row.original.id as string} />
      },
    },
  ]

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}

export const TRUST_CENTER_DOCS_SORT_FIELDS = [
  {
    key: 'created_at',
    label: 'Created At',
  },
  {
    key: 'updated_at',
    label: 'Updated At',
    default: {
      key: TrustCenterDocOrderField.updated_at,
      direction: OrderDirection.DESC,
    },
  },
]

import { Eye, FileQuestion, Folder } from 'lucide-react'
import { FilterField } from '@/types'
import { Checkbox } from '@repo/ui/checkbox'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import DocumentActions from '../../actions/documents-actions'
import DocumentsWatermarkStatusChip from '../../documents-watermark-status-chip.'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import StandardChip from '../../../standards/shared/standard-chip'

export const trustCenterDocsFilterFields: FilterField[] = [
  {
    key: 'trustCenterDocKindNameContainsFold',
    label: 'Category',
    type: 'text',
    icon: Folder,
  },
  {
    key: 'visibilityIn',
    label: 'Visibility',
    type: 'multiselect',
    options: enumToOptions(TrustCenterDocTrustCenterDocumentVisibility),
    icon: Eye,
  },
  {
    key: 'hasStandardWith',
    label: 'Standard Name',
    type: 'text',
    icon: FileQuestion,
  },
]
