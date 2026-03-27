'use client'
import React, { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { OrderDirection, TrustCenterDocOrderField, TrustCenterDocTrustCenterDocumentVisibility, type TrustCenterDocWatermarkStatus } from '@repo/codegen/src/schema'

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
  hasNdaTemplate: boolean
}

const VisibilityCell = ({ visibility, hasNdaTemplate }: { visibility: string; hasNdaTemplate: boolean }) => {
  const [isNdaOpen, setIsNdaOpen] = useState(false)
  const isProtected = visibility === TrustCenterDocTrustCenterDocumentVisibility.PROTECTED
  const showNdaWarning = isProtected && !hasNdaTemplate

  return (
    <div className="flex items-center gap-2">
      <Badge variant="document">{visibility.split('_').join(' ').toLowerCase()}</Badge>
      {showNdaWarning && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-warning" onClick={(e) => e.stopPropagation()} aria-label="Protected document requires NDA">
                  <AlertTriangle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">
                <span>Protected documents require a NDA to be uploaded. </span>
                <button
                  type="button"
                  className="underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsNdaOpen(true)
                  }}
                >
                  Upload NDA
                </button>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <NDAUploadDialog open={isNdaOpen} onOpenChange={setIsNdaOpen} />
        </>
      )}
    </div>
  )
}

export const getTrustCenterDocColumns = ({ selectedDocs, setSelectedDocs, hasNdaTemplate }: Params) => {
  const columns: ColumnDef<TTrustCenterDoc>[] = [
    createSelectColumn<TTrustCenterDoc>(selectedDocs, setSelectedDocs),
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
      cell: ({ row }) => <VisibilityCell visibility={row.original.visibility} hasNdaTemplate={hasNdaTemplate} />,
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
      cell: ({ row }) => <TagsCell tags={row.original.tags} />,
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
      size: 150,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      size: 100,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" />,
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

import { AlertTriangle, Eye, FileQuestion, Folder } from 'lucide-react'
import { type FilterField } from '@/types'
import { NDAUploadDialog } from '../../NDAs/components/NDA-upload-dialog'
import { Badge } from '@repo/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
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
