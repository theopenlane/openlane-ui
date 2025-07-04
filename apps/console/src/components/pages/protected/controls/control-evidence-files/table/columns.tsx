import { ColumnDef } from '@tanstack/react-table'
import React from 'react'

export const fileColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'providedFileName',
    header: 'Filename',
  },
  {
    accessorKey: 'providedFileSize',
    header: 'Size',
    cell: ({ cell }) => {
      return <div>{(Number(cell.getValue()) / 1024).toFixed(2)} KB</div>
    },
  },
]
