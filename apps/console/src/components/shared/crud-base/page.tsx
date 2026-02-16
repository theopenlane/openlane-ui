'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ExportExportFormat, ExportExportType } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { ObjectNames, ObjectTypes } from '@repo/codegen/src/type-names'
import { useRouter, useSearchParams } from 'next/navigation'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import { GenericDetailsSheet, GenericDetailsSheetConfig } from '@/components/shared/crud-base/generic-sheet'
import { GenericTableToolbar } from '@/components/shared/crud-base/table/table-toolbar'
import { TableKeyValue } from '@repo/ui/table-key'
import { TAccessRole, TPermissionData } from '@/types/authz'
import { FilterField } from '@/types'

interface GenericTablePageConfig<TEntity extends { id: string }, TFormData extends FieldValues, TData, TUpdateInput, TCreateInput, TWhereInput, TOrderByInput> {
  // Entity configuration
  objectType: ObjectTypes
  objectName: ObjectNames

  // Table configuration
  tableKey: TableKeyValue
  exportType?: ExportExportType

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderFieldEnum: any // e.g., AssetOrderField
  defaultSorting: TOrderByInput
  defaultVisibility: VisibilityState
  filterFields?: FilterField[] | undefined

  // Breadcrumbs
  breadcrumbs: Array<{ label: string; href: string }>

  // Form
  form: UseFormReturn<TFormData>

  // Columns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getColumns: (params: any) => ColumnDef<TEntity>[]

  // Table Component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TableComponent: React.ComponentType<any>

  // Toolbar Component
  ToolbarComponent?: React.ComponentType<{
    onFilterChange: (filters: TWhereInput | null) => void
    handleClearSelected: () => void
    handleExport: () => void
    mappedColumns: Array<{ accessorKey: string; header: string; meta?: { exportPrefix?: string } }>
    columnVisibility: VisibilityState
    setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
    searchTerm: string
    setSearchTerm: (term: string) => void
    searching: boolean
    canEdit: (roles: TAccessRole[]) => boolean
    permission: TPermissionData | undefined
    selectedItems: TEntity[]
    setSelectedItems: React.Dispatch<React.SetStateAction<TEntity[]>>
  }>

  // Sheet configuration
  sheetConfig: Omit<GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TCreateInput>, 'form' | 'onClose'>

  // Bulk operations
  onBulkDelete: (ids: string[]) => Promise<void>
  onBulkCreate?: (file: File) => Promise<void>

  renderBulkEdit?: (props: { selectedItems: TEntity[]; setSelectedItems: React.Dispatch<React.SetStateAction<TEntity[]>> }) => React.ReactNode
}

export function GenericTablePage<TEntity extends { id: string }, TFormData extends FieldValues, TData, TUpdateInput, TCreateInput, TWhereInput extends object, TOrderByInput>(
  config: GenericTablePageConfig<TEntity, TFormData, TData, TUpdateInput, TCreateInput, TWhereInput, TOrderByInput>,
) {
  const {
    objectType,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility,
    filterFields,
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    ToolbarComponent,
    sheetConfig,
    onBulkDelete,
    onBulkCreate,
    renderBulkEdit,
  } = config

  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const [searchQuery, setSearchQuery] = useStorageSearch(objectType)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { handleExport } = useFileExport()

  const tableRef = useRef<{ exportData: () => TEntity[] }>(null)

  const [filters, setFilters] = useState<TWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(tableKey, DEFAULT_PAGINATION))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderBy, setOrderBy] = useState<TOrderByInput>(getInitialSortConditions(tableKey, orderFieldEnum, defaultSorting as any) as TOrderByInput)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(tableKey, defaultVisibility))
  const [selectedItems, setSelectedItems] = useState<TEntity[]>([])

  const { data: permission } = useOrganizationRoles()

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch

  const handleCloseSheet = () => {
    form.reset()

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('id')
    newSearchParams.delete('create')
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
  }

  const whereFilter = useMemo(() => {
    if (!filters) return null

    const base = {}

    const result = whereGenerator<TWhereInput>(filters, (key, value) => {
      return { [key]: value } as TWhereInput
    })

    return { ...base, ...result } as TWhereInput
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  useEffect(() => {
    setCrumbs(breadcrumbs)
  }, [setCrumbs, breadcrumbs])

  const emptyUserMap = {}

  const mappedColumns = getColumns({
    userMap: emptyUserMap,
    selectedAssets: selectedItems,
    setSelectedAssets: setSelectedItems,
  })
    .filter(
      (
        column,
      ): column is ColumnDef<TEntity> & {
        accessorKey: string
        header: string
        meta?: { exportPrefix?: string }
      } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string',
    )
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
      meta: column.meta,
    }))

  function isVisibleColumn(col: (typeof mappedColumns)[0]): boolean {
    return columnVisibility[col.accessorKey] !== false
  }

  const handleExportFile = async () => {
    if (!exportType) return

    handleExport({
      exportType,
      filters: JSON.stringify(whereFilter),
      fields: mappedColumns.filter(isVisibleColumn).map((item) => item.meta?.exportPrefix ?? item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  const handleClearSelected = () => {
    setSelectedItems([])
  }

  const ToolbarToUse = ToolbarComponent || GenericTableToolbar

  return (
    <>
      <ToolbarToUse
        entityType={objectType}
        onFilterChange={setFilters}
        handleClearSelected={handleClearSelected}
        handleExport={handleExportFile}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        filterFields={filterFields}
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          setPagination(DEFAULT_PAGINATION)
        }}
        searching={searching}
        canEdit={canEdit}
        permission={permission}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        onBulkDelete={onBulkDelete}
        onBulkCreate={onBulkCreate}
        storageKey={tableKey}
        renderBulkEdit={renderBulkEdit}
      />

      <TableComponent
        ref={tableRef}
        orderByFilter={orderByFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        whereFilter={whereFilter}
        onSortChange={setOrderBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        selectedAssets={selectedItems}
        setSelectedAssets={setSelectedItems}
        canEdit={canEdit}
        defaultSorting={defaultSorting}
        permission={permission}
      />

      {(id || isCreate) && <GenericDetailsSheet<TFormData, TData, TUpdateInput, TCreateInput> key={id || 'create'} onClose={handleCloseSheet} form={form} {...sheetConfig} />}
    </>
  )
}
