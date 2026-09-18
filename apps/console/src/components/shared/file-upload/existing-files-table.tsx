'use client'

import React, { useEffect, useId, useMemo, useState } from 'react'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { type ColumnDef, type VisibilityState } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { Checkbox } from '@repo/ui/checkbox'
import { SELECT_COLUMN_ID } from '@repo/ui/pinned-columns'
import { Input } from '@repo/ui/input'
import { type TableKeyValue } from '@repo/ui/table-key'
import { useDebounce } from '@uidotdev/usehooks'
import { FileOrderField, OrderDirection, type CustomTypeEnumWhereInput, type FileWhereInput, type GetFilesQuery } from '@repo/codegen/src/schema'
import { useGetFiles } from '@/lib/graphql-hooks/file'
import { GLOBAL_ENUM_OBJECT_TYPE, useGetCustomTypeEnums, type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { getFileActionsColumn } from '@/components/shared/file-table/file-actions-column'
import { getFileDisplayName } from '@/components/shared/file-table/columns'
import FilePreviewDialog from '@/components/shared/file-preview/file-preview-dialog'
import { formatDateSince } from '@/utils/date'
import { toHumanLabel } from '@/utils/strings'
import { type TUploadedFile } from './types'

type TExistingFileRow = NonNullable<NonNullable<NonNullable<GetFilesQuery['files']['edges']>[number]>['node']>

export type TExistingFileSelection = TUploadedFile & { type: 'existingFile'; id: string; name: string }

type TProps = {
  tableKey: TableKeyValue
  selectedFileIds: string[]
  onSelect: (file: TExistingFileSelection) => void
  onDeselect: (fileId: string) => void
  where?: FileWhereInput
  defaultCategory?: string
}

const FILES_ORDER_BY = [{ field: FileOrderField.created_at, direction: OrderDirection.DESC }]

const FILE_CATEGORY_ENUM_WHERE: CustomTypeEnumWhereInput = { objectType: GLOBAL_ENUM_OBJECT_TYPE, field: 'category' }

const PAGE_SIZE_OPTIONS = [5, 10]
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]
const ALL_CATEGORIES = 'all'
const ALL_CATEGORIES_OPTION: CustomTypeEnumOption = { value: ALL_CATEGORIES, label: 'All categories' }

const DEFAULT_FILES_PAGINATION = { page: 1, pageSize: DEFAULT_PAGE_SIZE, query: { first: DEFAULT_PAGE_SIZE } }

const ExistingFilesTable: React.FC<TProps> = ({ tableKey, selectedFileIds, onSelect, onDeselect, where, defaultCategory }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState(defaultCategory ?? ALL_CATEGORIES)
  const [previewFile, setPreviewFile] = useState<TExistingFileRow | null>(null)
  const categorySelectId = useId()
  const debouncedSearch = useDebounce(searchTerm, 300)
  const { enumOptions } = useGetCustomTypeEnums({ where: FILE_CATEGORY_ENUM_WHERE })

  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_FILES_PAGINATION, tableKey, PAGE_SIZE_OPTIONS)

  const categoryOptions = useMemo(() => {
    const options = [ALL_CATEGORIES_OPTION, ...enumOptions.map((option) => ({ ...option, label: toHumanLabel(option.label) }))]

    return options.some((option) => option.value === category) ? options : [...options, { value: category, label: toHumanLabel(category) }]
  }, [enumOptions, category])

  const fileWhere = useMemo<FileWhereInput>(
    () => ({
      ...where,
      ...(category === ALL_CATEGORIES ? {} : { categoryName: category }),
      ...(debouncedSearch ? { or: [{ providedFileNameContainsFold: debouncedSearch }, { nameContainsFold: debouncedSearch }] } : {}),
    }),
    [where, category, debouncedSearch],
  )

  useEffect(() => {
    resetPagination()
  }, [debouncedSearch, category, resetPagination])

  const { files, isFetching, paginationMeta } = useGetFiles({ where: fileWhere, orderBy: FILES_ORDER_BY, pagination })

  const rows = useMemo(() => files.filter((file): file is TExistingFileRow => !!file), [files])
  const selectedIds = useMemo(() => new Set(selectedFileIds), [selectedFileIds])

  const toSelection = (file: TExistingFileRow): TExistingFileSelection => ({
    type: 'existingFile',
    id: file.id,
    name: getFileDisplayName(file),
    size: file.providedFileSize ?? undefined,
    category: file.categoryName,
    createdAt: formatDateSince(file.createdAt),
  })

  const columnVisibility = useMemo<VisibilityState>(() => ({ categoryName: category === ALL_CATEGORIES, providedFileName: false }), [category])

  const columns = useMemo<ColumnDef<TExistingFileRow>[]>(() => {
    return [
      {
        id: SELECT_COLUMN_ID,
        header: () => (
          <div role="presentation" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              aria-label="Select all rows on this page"
              checked={rows.length > 0 && rows.every((file) => selectedIds.has(file.id))}
              onCheckedChange={(checked: boolean) =>
                checked
                  ? rows.filter((file) => !selectedIds.has(file.id)).forEach((file) => onSelect(toSelection(file)))
                  : rows.filter((file) => selectedIds.has(file.id)).forEach((file) => onDeselect(file.id))
              }
            />
          </div>
        ),
        cell: ({ row }) => (
          <div role="presentation" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              aria-label={`Select ${getFileDisplayName(row.original)}`}
              checked={selectedIds.has(row.original.id)}
              onCheckedChange={(checked: boolean) => (checked ? onSelect(toSelection(row.original)) : onDeselect(row.original.id))}
            />
          </div>
        ),
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => getFileDisplayName(row.original),
      },
      {
        accessorKey: 'providedFileName',
        header: 'File Name',
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => toHumanLabel(row.original.categoryName ?? ''),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDateSince(row.original.createdAt),
      },
      getFileActionsColumn<TExistingFileRow>({ onPreview: setPreviewFile }),
    ]
  }, [rows, selectedIds, onSelect, onDeselect])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          icon={isFetching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
          variant="searchTable"
          className="flex-1 min-w-52"
        />
        <div className="flex items-center gap-2">
          <label htmlFor={categorySelectId} className="text-sm whitespace-nowrap">
            Category
          </label>
          <CreatableCustomTypeEnumSelect triggerId={categorySelectId} value={category} options={categoryOptions} onValueChange={setCategory} useCustomDisplay={false} triggerClassName="w-48 h-9" />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isFetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        columnVisibility={columnVisibility}
        tableKey={tableKey}
      />

      <FilePreviewDialog file={previewFile} open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)} />
    </div>
  )
}

export default ExistingFilesTable
