'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Link, PlusCircle } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { useGetFiles } from '@/lib/graphql-hooks/file'
import { formatDateSince } from '@/utils/date'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type ColumnDef } from '@repo/ui/table-types'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { getFileCategory, getFileDisplayName, type TFile } from '@/components/shared/file-table/columns'

type ExistingFileRow = Pick<TFile, 'id' | 'name' | 'providedFileName' | 'providedFileExtension' | 'metadata' | 'createdAt'>

type ExistingFilesDialogProps = {
  selectedFileIds: string[]
  onFileSelected: (file: { id: string; name: string }) => void
}

const ExistingFilesDialog: React.FC<ExistingFilesDialogProps> = ({ selectedFileIds, onFileSelected }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [pagination, setPagination] = useOrgTablePagination(
    {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
      page: 1,
      query: { first: 5 },
    },
    TableKeyEnum.EXISTING_FILES,
  )

  const { data, isLoading, paginationMeta } = useGetFiles({ pagination })
  const [files, setFiles] = useState<ExistingFileRow[]>([])

  useEffect(() => {
    if (!isLoading) {
      const tableData: ExistingFileRow[] =
        data?.files?.edges?.map((edge) => ({
          id: edge?.node?.id ?? '',
          name: edge?.node?.name ?? '',
          providedFileName: edge?.node?.providedFileName ?? '',
          providedFileExtension: edge?.node?.providedFileExtension ?? '',
          metadata: edge?.node?.metadata ?? null,
          createdAt: edge?.node?.createdAt ?? '',
        })) || []

      setFiles(tableData)
    }
  }, [isLoading, data?.files?.edges])

  const handleAdd = (row: ExistingFileRow) => {
    if (selectedFileIds.includes(row.id)) return
    onFileSelected({ id: row.id, name: getFileDisplayName(row) })
  }

  const columns: ColumnDef<ExistingFileRow>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => getFileDisplayName(row.original),
    },
    {
      accessorKey: 'metadata',
      header: 'Category',
      cell: ({ row }) => getFileCategory(row.original) ?? '-',
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
