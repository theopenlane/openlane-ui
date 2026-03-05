'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Link, PlusCircle } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { useGetFiles } from '@/lib/graphql-hooks/file'
import { formatDateSince } from '@/utils/date'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type ColumnDef } from '@tanstack/react-table'

type ExistingFileRow = {
  id: string
  providedFileName: string
  providedFileExtension: string
  categoryType?: string | null
  createdAt?: string | null
}

type ExistingFilesDialogProps = {
  selectedFileIds: string[]
  onFileSelected: (file: { id: string; name: string }) => void
}

const ExistingFilesDialog: React.FC<ExistingFilesDialogProps> = ({ selectedFileIds, onFileSelected }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [pagination, setPagination] = useState<TPagination>(() =>
    getInitialPagination(TableKeyEnum.EXISTING_FILES, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
      page: 1,
      query: { first: 5 },
    }),
  )

  const { data, isLoading, paginationMeta } = useGetFiles({ pagination })
  const [files, setFiles] = useState<ExistingFileRow[]>([])

  useEffect(() => {
    if (!isLoading) {
      const tableData: ExistingFileRow[] =
        data?.files?.edges?.map((edge) => ({
          id: edge?.node?.id ?? '',
          providedFileName: edge?.node?.providedFileName ?? '',
          providedFileExtension: edge?.node?.providedFileExtension ?? '',
          categoryType: edge?.node?.categoryType ?? '',
          createdAt: edge?.node?.createdAt ?? '',
        })) || []

      setFiles(tableData)
    }
  }, [isLoading, data?.files?.edges])

  const handleAdd = (row: ExistingFileRow) => {
    if (selectedFileIds.includes(row.id)) return
    onFileSelected({ id: row.id, name: row.providedFileName })
  }

  const columns: ColumnDef<ExistingFileRow>[] = [
    {
      accessorKey: 'providedFileName',
      header: 'Filename',
    },
    {
      accessorKey: 'categoryType',
      header: 'Category',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        const column = row.original
        const isAlreadyAdded = selectedFileIds.includes(column.id)
        return (
          <div className="flex items-center justify-between w-full">
            <span>{formatDateSince(column.createdAt)}</span>
            {!isAlreadyAdded && <PlusCircle className="w-5 h-5 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={() => handleAdd(column)} />}
          </div>
        )
      },
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" icon={<Link />} iconPosition="left" onClick={() => setIsOpen(true)}>
          Link Existing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link Existing Files</DialogTitle>
        </DialogHeader>
        <DataTable
          columns={columns}
          data={files}
          pagination={pagination}
          onPaginationChange={(p: TPagination) => setPagination(p)}
          paginationMeta={paginationMeta}
          tableKey={TableKeyEnum.EXISTING_FILES}
        />
      </DialogContent>
    </Dialog>
  )
}

export { ExistingFilesDialog }
