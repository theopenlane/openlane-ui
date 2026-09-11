import { type ColumnDef } from '@repo/ui/table-types'
import React from 'react'
import { CustomTypeEnumOptionChip } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'

export type TFile = {
  __typename?: 'File'
  name?: string | null
  providedFileName: string
  providedFileSize?: number | null
  providedFileExtension: string
  detectedMimeType?: string | null
  id: string
  uri?: string | null
  presignedURL?: string | null
  metadata?: Record<string, unknown> | null
  createdAt?: string | null
}

export const getFileDisplayName = (file: Pick<TFile, 'name' | 'providedFileName'>): string => file.name?.trim() || file.providedFileName

export const getFileCategory = (file: Pick<TFile, 'metadata'>): string | undefined => {
  const category = file.metadata?.category

  return typeof category === 'string' ? category.trim() || undefined : undefined
}

export const fileNameColumn: ColumnDef<TFile> = {
  accessorKey: 'name',
  header: 'Name',
  size: 280,
  cell: ({ row }) => <span className="block truncate">{getFileDisplayName(row.original)}</span>,
}

export const originalFileNameColumn: ColumnDef<TFile> = {
  accessorKey: 'providedFileName',
  header: 'File Name',
  size: 280,
  cell: ({ row }) => <span className="block truncate">{row.original.providedFileName}</span>,
}

export const createFileCategoryColumn = (options: CustomTypeEnumOption[]): ColumnDef<TFile> => ({
  accessorKey: 'metadata',
  header: 'Category',
  size: 150,
  cell: ({ row }) => {
    const category = getFileCategory(row.original)
    if (!category) {
      return <span className="text-muted-foreground">-</span>
    }
    return <CustomTypeEnumOptionChip option={options.find((option) => option.value === category) ?? { value: category, label: category }} />
  },
})

export const fileSizeColumn: ColumnDef<TFile> = {
  accessorKey: 'providedFileSize',
  header: 'Size',
  cell: ({ cell }) => {
    const size = cell.getValue() as number | null
    return <div>{size ? (size / 1024).toFixed(2) : '0'} KB</div>
  },
}

export const fileColumns: ColumnDef<TFile>[] = [
  {
    accessorKey: 'providedFileName',
    header: 'Filename',
  },
  fileSizeColumn,
]
