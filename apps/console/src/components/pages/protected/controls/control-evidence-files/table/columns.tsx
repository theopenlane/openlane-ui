import { ColumnDef } from '@tanstack/react-table'
import React from 'react'

export type TFile = {
  __typename?: 'File'
  providedFileName: string
  providedFileSize?: number | null
  providedFileExtension: string
  id: string
  uri?: string | null
  presignedURL?: string | null
}

export const fileColumns: ColumnDef<TFile>[] = [
  {
    accessorKey: 'providedFileName',
    header: 'Filename',
  },
  {
    accessorKey: 'providedFileSize',
    header: 'Size',
    cell: ({ cell }) => {
      const size = cell.getValue() as number | null
      return <div>{size ? (size / 1024).toFixed(2) : '0'} KB</div>
    },
  },
]
