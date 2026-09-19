'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { hashKey } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { type TableKeyValue } from '@repo/ui/table-key'
import { FileOrderField, OrderDirection, type FileWhereInput, type GetFilesQuery } from '@repo/codegen/src/schema'
import { useGetFiles } from '@/lib/graphql-hooks/file'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { fileNameSearchWhere } from './table-config'

export type TFileRow = NonNullable<NonNullable<NonNullable<GetFilesQuery['files']['edges']>[number]>['node']>

export const FILES_PAGE_SIZE_OPTIONS = [5, 10]

const FILES_ORDER_BY = [{ field: FileOrderField.created_at, direction: OrderDirection.DESC }]
const DEFAULT_PAGE_SIZE = FILES_PAGE_SIZE_OPTIONS[0]
const DEFAULT_PAGINATION = { page: 1, pageSize: DEFAULT_PAGE_SIZE, query: { first: DEFAULT_PAGE_SIZE } }

type TUseFilesTableStateProps = {
  tableKey: TableKeyValue
  where?: FileWhereInput
  withEvidence?: boolean
}

export const useFilesTableState = ({ tableKey, where, withEvidence }: TUseFilesTableStateProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [previewFile, setPreviewFile] = useState<TFileRow | null>(null)
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, tableKey, FILES_PAGE_SIZE_OPTIONS)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const whereKey = hashKey([where ?? {}])

  const search = useCallback(
    (term: string) => {
      setSearchTerm(term)
      resetPagination()
    },
    [resetPagination],
  )

  useEffect(() => {
    resetPagination()
  }, [whereKey, resetPagination])

  const fileWhere = useMemo<FileWhereInput>(() => {
    const searchWhere = fileNameSearchWhere(debouncedSearch)

    return searchWhere ? { ...where, and: [...(where?.and ?? []), searchWhere] } : { ...where }
  }, [where, debouncedSearch])

  const { files, isFetching, paginationMeta } = useGetFiles({ where: fileWhere, orderBy: FILES_ORDER_BY, pagination, withEvidence })

  const rows = useMemo(() => files.filter((file): file is TFileRow => !!file), [files])

  return { searchTerm, search, resetPagination, rows, isFetching, pagination, setPagination, paginationMeta, previewFile, setPreviewFile }
}
