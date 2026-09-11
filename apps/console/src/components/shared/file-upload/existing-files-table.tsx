'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { PlusCircle, SearchIcon } from 'lucide-react'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { type TableKeyValue } from '@repo/ui/table-key'
import { useDebounce } from '@uidotdev/usehooks'
import { FileOrderField, OrderDirection, type FileWhereInput, type GetFilesQuery } from '@repo/codegen/src/schema'
import { useGetFiles } from '@/lib/graphql-hooks/file'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDateSince } from '@/utils/date'
import { toHumanLabel } from '@/utils/strings'
import { type TUploadedFile } from './types'

type TExistingFileRow = NonNullable<NonNullable<NonNullable<GetFilesQuery['files']['edges']>[number]>['node']>

export type TExistingFileSelection = TUploadedFile & { type: 'existingFile'; id: string; name: string }

type TProps = {
  tableKey: TableKeyValue
  selectedFileIds: string[]
  onSelect: (file: TExistingFileSelection) => void
  where?: FileWhereInput
}

const FILES_ORDER_BY = [{ field: FileOrderField.created_at, direction: OrderDirection.DESC }]

const ExistingFilesTable: React.FC<TProps> = ({ tableKey, selectedFileIds, onSelect, where }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(
    {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
      page: 1,
      query: { first: 5 },
    },
    tableKey,
  )

  const fileWhere = useMemo<FileWhereInput>(() => ({ ...where, ...(debouncedSearch ? { providedFileNameContainsFold: debouncedSearch } : {}) }), [where, debouncedSearch])

  useEffect(() => {
    resetPagination()
  }, [debouncedSearch, resetPagination])

  const { files, isFetching, paginationMeta } = useGetFiles({ where: fileWhere, orderBy: FILES_ORDER_BY, pagination })

  const rows = useMemo(() => files.filter((file): file is TExistingFileRow => !!file), [files])
  const selectedIds = useMemo(() => new Set(selectedFileIds), [selectedFileIds])

  const columns = useMemo<ColumnDef<TExistingFileRow>[]>(
    () => [
      {
        accessorKey: 'providedFileName',
        header: 'Filename',
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => toHumanLabel(row.original.categoryName ?? ''),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const file = row.original

          return (
            <div className="flex items-center justify-between w-full">
              <span>{formatDateSince(file.createdAt)}</span>
              {!selectedIds.has(file.id) && (
                <button
                  type="button"
                  aria-label={`Add ${file.providedFileName}`}
                  onClick={() => {
                    if (selectedIds.has(file.id)) {
                      return
                    }

                    onSelect({
                      type: 'existingFile',
                      id: file.id,
                      name: file.providedFileName,
                      size: file.providedFileSize ?? undefined,
                      category: file.categoryName,
                      createdAt: formatDateSince(file.createdAt),
                    })
                  }}
                >
                  <PlusCircle className="w-5 h-5 text-primary cursor-pointer hover:scale-105 transition-transform" />
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [selectedIds, onSelect],
  )

  return (
    <div className="flex flex-col gap-3">
      <Input icon={<SearchIcon size={16} />} placeholder="Search files..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" />
      <DataTable columns={columns} data={rows} loading={isFetching} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} tableKey={tableKey} />
    </div>
  )
}

export default ExistingFilesTable
