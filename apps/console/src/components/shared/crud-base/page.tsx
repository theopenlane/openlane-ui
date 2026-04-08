'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { ExportExportFormat, type ExportExportType, OrderDirection } from '@repo/codegen/src/schema'
import { type ZodObject, type ZodRawShape } from 'zod'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { getInitialSortConditions, getInitialPagination, type SortCondition } from '@repo/ui/data-table'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { type ObjectNames, type ObjectTypes } from '@repo/codegen/src/type-names'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FieldValues, type UseFormReturn } from 'react-hook-form'
import { GenericDetailsSheet, type GenericDetailsSheetConfig } from '@/components/shared/crud-base/generic-sheet'
import { TabbedDetailView } from '@/components/shared/crud-base/tabbed-detail-view'
import { StepDialog } from '@/components/shared/crud-base/step-dialog'
import { GenericTableToolbar } from '@/components/shared/crud-base/table/table-toolbar'
import { type ResponsibilityFieldsMap } from '@/components/shared/crud-base/dialog/bulk-edit'
import { type TableKeyValue } from '@repo/ui/table-key'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { type FilterField } from '@/types'
import { type User } from '@repo/codegen/src/schema'
import type { ViewEditMode, CreateMode } from './types'

type TOrderByInput = { field: string; direction?: OrderDirection }[] | undefined
type TOrderFieldEnum<TField> = Record<string, TField> | TField[]

export type CustomEnumOption = { label: string; value: string }
export type EnumOptionsGeneric<T extends string = string> = Record<T, CustomEnumOption[]>
export type EnumCreateHandlers = Partial<Record<string, (value: string) => Promise<void>>>

export type ColumnOptions = {
  userMap: Record<string, User>
  convertToReadOnly?: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  selectedItems: { id: string }[]
  setSelectedItems: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export interface TTableProps<TWhereInput> {
  ref?: React.Ref<HTMLDivElement>
  onSortChange?: (sortCondition: TOrderByInput) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: TWhereInput | null
  orderByFilter: TOrderByInput | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  onHasChange?: (hasItems: boolean) => void
  selectedItems: { id: string }[]
  setSelectedItems: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
  defaultSorting: SortCondition<string>[]
  onRowClick?: (item: { id: string }) => void
}

export interface GenericTablePageConfig<TEntity extends { id: string }, TFormData extends FieldValues, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField extends string> {
  // Entity configuration
  objectType: ObjectTypes
  objectName: ObjectNames
  displayName?: string

  // Table configuration
  tableKey: TableKeyValue
  exportType?: ExportExportType

  orderFieldEnum: TOrderFieldEnum<TOrderField>
  defaultSorting: SortCondition<TOrderField>[]

  defaultVisibility: VisibilityState
  filterFields?: FilterField[] | undefined
  searchFields?: string[]

  // Breadcrumbs
  breadcrumbs: Array<{ label: string; href: string }>

  // Form
  form: UseFormReturn<TFormData>

  // Columns
  getColumns: (params: ColumnOptions) => ColumnDef<TEntity>[]

  // Table Component
  TableComponent: React.ComponentType<TTableProps<TWhereInput>>

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
    selectedItems: { id: string }[]
    setSelectedItems: React.Dispatch<React.SetStateAction<{ id: string }[]>>
    bulkEditFormSchema?: ZodObject<ZodRawShape>
    enumOpts?: EnumOptionsGeneric
    responsibilityFields?: ResponsibilityFieldsMap
    createMode?: CreateMode
    additionalActiveFilterCount?: number
  }>

  // Sheet configuration
  sheetConfig: Omit<GenericDetailsSheetConfig<TFormData, TEntity, TUpdateInput, TUpdateData, TCreateInput, TCreateData>, 'form' | 'onClose'>

  // View/Create mode configuration
  viewEditMode?: ViewEditMode<TEntity, TUpdateInput>
  createMode?: CreateMode

  // Bulk operations
  onBulkDelete: (ids: string[]) => Promise<void>
  onBulkCreate?: (file: File) => Promise<void>
  onBulkEdit?: (ids: string[], data: TUpdateInput) => Promise<void>
  bulkEditFormSchema?: ZodObject<ZodRawShape>
  enumOpts?: EnumOptionsGeneric
  responsibilityFields?: ResponsibilityFieldsMap
  beforeTable?: React.ReactNode
  additionalWhereFilter?: Partial<TWhereInput>
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
    displayName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility,
    filterFields,
    searchFields,
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    ToolbarComponent,
    sheetConfig,
    viewEditMode,
    createMode,
    onBulkDelete,
    onBulkCreate,
    onBulkEdit,
  } = config

  const { beforeTable, additionalWhereFilter } = config

  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'

  const [searchQuery, setSearchQuery] = useStorageSearch(objectType)
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { handleExport } = useFileExport()

  const [filters, setFilters] = useState<TWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(tableKey, DEFAULT_PAGINATION))
  const [orderBy, setOrderBy] = useState<SortCondition<TOrderField>[]>(() => getInitialSortConditions(tableKey, orderFieldEnum, defaultSorting))
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(tableKey, defaultVisibility))
  const [selectedItems, setSelectedItems] = useState<{ id: string }[]>([])

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
    const result = filters
      ? (whereGenerator<TWhereInput>(filters, (key, value) => {
          return { [key]: value } as TWhereInput
        }) as Record<string, unknown>)
      : ({} as Record<string, unknown>)

    const merged = { ...result }

    if (debouncedSearch && searchFields && searchFields.length > 0) {
      const orClause = searchFields.map((field) => ({ [field]: debouncedSearch }))
      merged.and = [...((merged.and as unknown[]) || []), { or: orClause }]
    }

    if (additionalWhereFilter && Object.keys(additionalWhereFilter).length > 0) {
      Object.assign(merged, additionalWhereFilter)
    }

    if (Object.keys(merged).length === 0) return null

    return merged as TWhereInput
  }, [filters, debouncedSearch, searchFields, additionalWhereFilter])

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

  const resolvedViewMode = viewEditMode?.type ?? 'slideout'
  const resolvedCreateMode = createMode?.type ?? 'slideout'

  const onRowClick = useMemo(() => {
    if (resolvedViewMode === 'full-page' && viewEditMode?.type === 'full-page') {
      const route = viewEditMode.route
      return (item: { id: string }) => router.push(`${route}/${item.id}`)
    }
    return undefined
  }, [resolvedViewMode, viewEditMode, router])

  const renderDetailView = () => {
    // Handle step-dialog create mode
    if (isCreate && resolvedCreateMode === 'step-dialog' && createMode?.type === 'step-dialog') {
      if (!sheetConfig.createMutation || !sheetConfig.buildPayload) return null
      return (
        <StepDialog<TFormData, TCreateInput, TCreateData>
          key="create-step-dialog"
          objectType={sheetConfig.objectType}
          form={form}
          steps={createMode.steps}
          title={createMode.title}
          createMutation={sheetConfig.createMutation}
          buildPayload={sheetConfig.buildPayload as (data: TFormData) => Promise<TCreateInput>}
          onClose={handleCloseSheet}
        />
      )
    }

    // Handle full-page create mode — create button navigates away, nothing to render
    if (isCreate && resolvedCreateMode === 'full-page') {
      return null
    }

    // Handle full-page view/edit mode — detail is on another route, nothing to render
    if (id && resolvedViewMode === 'full-page') {
      return null
    }

    // Handle tabbed view/edit mode
    if (id && resolvedViewMode === 'tabbed' && viewEditMode?.type === 'tabbed') {
      return <TabbedDetailView<TFormData, TEntity, TUpdateInput, TUpdateData, TCreateInput, TCreateData> key={id} onClose={handleCloseSheet} form={form} tabs={viewEditMode.tabs} {...sheetConfig} />
    }

    // Default: slideout for both view/edit and create
    if (id || isCreate) {
      return <GenericDetailsSheet<TFormData, TEntity, TUpdateInput, TUpdateData, TCreateInput, TCreateData> key={id || 'create'} onClose={handleCloseSheet} form={form} {...sheetConfig} />
    }

    return null
  }

  return (
    <>
      {beforeTable}
      <ToolbarToUse
        entityType={objectType}
        displayName={displayName}
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
          setPagination((prev) => ({ ...prev, page: 1, query: { first: prev.pageSize } }))
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
        responsibilityFields={config.responsibilityFields}
        createMode={createMode}
        additionalActiveFilterCount={additionalWhereFilter ? Object.values(additionalWhereFilter).filter((v) => v != null).length : 0}
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
        onRowClick={onRowClick}
      />

      {renderDetailView()}
    </>
  )
}
