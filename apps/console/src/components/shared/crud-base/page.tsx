'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { ExportExportFormat, ExportExportType, OrderDirection } from '@repo/codegen/src/schema'
import { ZodObject, ZodRawShape } from 'zod'
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
import { getInitialSortConditions, getInitialPagination, SortCondition } from '@repo/ui/data-table'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { ObjectNames, ObjectTypes } from '@repo/codegen/src/type-names'
import { useRouter, useSearchParams } from 'next/navigation'
import { FieldValues, UseFormReturn } from 'react-hook-form'
import { GenericDetailsSheet, GenericDetailsSheetConfig } from '@/components/shared/crud-base/generic-sheet'
import { GenericTableToolbar } from '@/components/shared/crud-base/table/table-toolbar'
import { TableKeyValue } from '@repo/ui/table-key'
import { TAccessRole, TPermissionData } from '@/types/authz'
import { FilterField } from '@/types'
import { User } from '@repo/codegen/src/schema'

type TOrderByInput = { field: string; direction?: OrderDirection }[] | undefined
type TOrderFieldEnum<TField> = Record<string, TField> | TField[]

export type CustomEnumOption = { label: string; value: string }
export type EnumOptionsGeneric<T extends string = string> = Record<T, CustomEnumOption[]>

export type ColumnOptions<TEntity> = {
  userMap: Record<string, User>
  convertToReadOnly?: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  selectedItems: TEntity[]
  setSelectedItems: React.Dispatch<React.SetStateAction<TEntity[]>>
}

export interface TTableProps<TEntity extends { id: string }, TWhereInput> {
  ref?: React.Ref<HTMLDivElement>
  onSortChange?: (sortCondition: TOrderByInput) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: TWhereInput | null
  orderByFilter: TOrderByInput | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  onHasChange?: (hasItems: boolean) => void
  selectedItems: TEntity[]
  setSelectedItems: React.Dispatch<React.SetStateAction<TEntity[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
  defaultSorting: SortCondition<string>[]
}

export interface GenericTablePageConfig<TEntity extends { id: string }, TFormData extends FieldValues, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField extends string> {
  // Entity configuration
  objectType: ObjectTypes
  objectName: ObjectNames

  // Table configuration
  tableKey: TableKeyValue
  exportType?: ExportExportType

  orderFieldEnum: TOrderFieldEnum<TOrderField>
  defaultSorting: SortCondition<TOrderField>[]

  defaultVisibility: VisibilityState
  filterFields?: FilterField[] | undefined

  // Breadcrumbs
  breadcrumbs: Array<{ label: string; href: string }>

  // Form
  form: UseFormReturn<TFormData>

  // Columns
  getColumns: (params: ColumnOptions<TEntity>) => ColumnDef<TEntity>[]

  // Table Component
  TableComponent: React.ComponentType<TTableProps<TEntity, TWhereInput>>

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
    bulkEditFormSchema?: ZodObject<ZodRawShape>
    enumOpts?: EnumOptionsGeneric
  }>

  // Sheet configuration
  sheetConfig: Omit<GenericDetailsSheetConfig<TFormData, TEntity, TUpdateInput, TUpdateData, TCreateInput, TCreateData>, 'form' | 'onClose'>

  // Bulk operations
  onBulkDelete: (ids: string[]) => Promise<void>
  onBulkCreate?: (file: File) => Promise<void>
  onBulkEdit?: (ids: string[], data: TUpdateInput) => Promise<void>
  bulkEditFormSchema?: ZodObject<ZodRawShape>
  enumOpts?: EnumOptionsGeneric
}

export function GenericTablePage<
  TEntity extends { id: string },
  TFormData extends FieldValues,
  TUpdateInput,
  TUpdateData,
  TCreateInput,
  TCreateData,
  TWhereInput extends object,
  TOrderField extends string,
>(config: GenericTablePageConfig<TEntity, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>) {
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
    onBulkEdit,
  } = config

  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const [searchQuery, setSearchQuery] = useStorageSearch(objectType)
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { handleExport } = useFileExport()

  const [filters, setFilters] = useState<TWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(tableKey, DEFAULT_PAGINATION))
  const [orderBy, setOrderBy] = useState<SortCondition<TOrderField>[]>(getInitialSortConditions(tableKey, orderFieldEnum, defaultSorting))
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
    selectedItems,
    setSelectedItems,
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

  const handleSortChange = useCallback(
    (sortCondition: TOrderByInput) => {
      setOrderBy(
        (sortCondition ?? []).map((sc) => ({
          field: sc.field as TOrderField,
          direction: sc.direction ?? OrderDirection.ASC,
        })),
      )
    },
    [setOrderBy],
  )

  const ToolbarToUse = ToolbarComponent || GenericTableToolbar

  return (
    <>
      <ToolbarToUse
        entityType={objectType}
        onFilterChange={(filters) => {
          setFilters((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(filters)) {
              return filters as TWhereInput
            }
            return prev
          })
        }}
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
        onBulkEdit={onBulkEdit as unknown as (ids: string[], data: TUpdateInput) => Promise<void>}
        bulkEditFormSchema={config.bulkEditFormSchema}
        enumOpts={config.enumOpts}
        storageKey={tableKey}
      />

      <TableComponent
        orderByFilter={orderByFilter}
        pagination={pagination}
        onPaginationChange={setPagination}
        whereFilter={whereFilter}
        onSortChange={handleSortChange}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        canEdit={canEdit}
        defaultSorting={defaultSorting}
        permission={permission}
      />

      {(id || isCreate) && (
        <GenericDetailsSheet<TFormData, TEntity, TUpdateInput, TUpdateData, TCreateInput, TCreateData> key={id || 'create'} onClose={handleCloseSheet} form={form} {...sheetConfig} />
      )}
    </>
  )
}
