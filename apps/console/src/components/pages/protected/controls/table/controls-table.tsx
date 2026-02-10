'use client'

import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import {
  ControlControlStatus,
  ControlListFieldsFragment,
  ControlOrderField,
  ControlWhereInput,
  ExportExportFormat,
  ExportExportType,
  GetAllControlsQueryVariables,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ControlsTableToolbar from './controls-table-toolbar'
import { CONTROLS_SORT_FIELDS, getControlColumns } from './table-config'
import { useDebounce } from '@uidotdev/usehooks'
import { VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useNotification } from '@/hooks/useNotification'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import TabSwitcher from '@/components/shared/tab-switcher/tab-switcher.tsx'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys.ts'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchKeyEnum, useStorageSearch } from '@/hooks/useStorageSearch'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'

type TControlsTableProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
}

const ControlsTable: React.FC<TControlsTableProps> = ({ active, setActive }) => {
  const { push } = useRouter()
  const { convertToReadOnly } = usePlateEditor()
  const [filters, setFilters] = useState<ControlWhereInput>({})
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { data: permission } = useOrganizationRoles()
  const { handleExport } = useFileExport()
  const { errorNotification } = useNotification()
  const defaultSorting = getInitialSortConditions(TableKeyEnum.CONTROL, ControlOrderField, [
    {
      field: ControlOrderField.ref_code,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<GetAllControlsQueryVariables['orderBy']>(defaultSorting)

  const defaultVisibility: VisibilityState = {
    id: false,
    referenceID: false,
    auditorReferenceID: false,
    category: false,
    subcategory: false,
    source: false,
    referenceFramework: false,
    delegate: false,
    createdBy: false,
    createdAt: false,
    updatedBy: false,
    updatedAt: false,
    controlImplementationsDetails: false,
    desiredOutcome: false,
    linkedProcedures: false,
    linkedPolicies: false,
    associatedObjects: false,
    comments: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.CONTROL, defaultVisibility))

  const [searchTerm, setSearchTerm] = useStorageSearch(SearchKeyEnum.CONTROLS)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.CONTROL, DEFAULT_PAGINATION))
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string }[]>([])

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'control',
      field: 'kind',
    },
  })

  const whereFilter = useMemo(() => {
    const base: ControlWhereInput = {}

    const result = whereGenerator<ControlWhereInput>(filters, (key, value) => {
      // Special case: CUSTOM pseudo-standard
      if (key === 'standardIDIn' && Array.isArray(value) && value.includes('CUSTOM')) {
        const normalStandards = value.filter((id) => id !== 'CUSTOM')

        return {
          or: [...(normalStandards.length > 0 ? [{ standardIDIn: normalStandards }] : []), { referenceFrameworkIsNil: true }],
        }
      }

      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as ControlWhereInput
      }

      return { [key]: value } as ControlWhereInput
    })

    // Check if the user explicitly filtered by status
    const hasStatusCondition = (obj: ControlWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    // Automatically exclude archived unless overridden
    if (!hasStatusCondition(result)) {
      result.statusNEQ = ControlControlStatus.ARCHIVED
    }

    return { ...base, ...result }
  }, [filters])

  const whereWithSearch: ControlWhereInput = useMemo(() => {
    const baseWhere = { ...whereFilter, ownerIDNEQ: '' }

    if (!debouncedSearch) return baseWhere

    return {
      ...baseWhere,
      and: [
        ...(baseWhere.and || []),
        {
          or: [{ refCodeContainsFold: debouncedSearch }, { descriptionContainsFold: debouncedSearch }],
        },
      ],
    }
  }, [whereFilter, debouncedSearch])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
  }, [permission?.roles])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
    ])
  }, [setCrumbs])

  const { controls, isError, paginationMeta, isLoading, isFetching } = useGetAllControls({
    where: whereWithSearch,
    orderBy,
    pagination,
    enabled: true,
  })

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load controls',
      })
    }
  }, [isError, errorNotification])

  const userIds = useMemo(() => {
    if (!controls) return []
    const ids = new Set<string>()
    controls.forEach((task) => {
      if (task.createdBy) ids.add(task.createdBy)
      if (task.updatedBy) ids.add(task.updatedBy)
    })
    return Array.from(ids)
  }, [controls])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const columns = useMemo(() => getControlColumns({ convertToReadOnly, userMap, selectedControls, setSelectedControls, enumOptions }), [convertToReadOnly, userMap, selectedControls, enumOptions])

  const mappedColumns: { accessorKey: string; header: string }[] = columns
    .filter((column): column is { accessorKey: string; header: string } => typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleRowClick = (row: ControlListFieldsFragment) => {
    push(`/controls/${row.id}`)
  }

  const handleExportFile = async () => {
    if (!controls || controls.length === 0) {
      return
    }

    handleExport({
      exportType: ExportExportType.CONTROL,
      filters: JSON.stringify(whereFilter),
      fields: columns.filter(isVisibleColumn).map((item) => (item.meta as { exportPrefix?: string })?.exportPrefix ?? item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  const handleClearSelectedControls = () => {
    setSelectedControls([])
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl tracking-[-0.056rem] text-header">Controls</h1>
          <TabSwitcher active={active} setActive={setActive} storageKey={TabSwitcherStorageKeys.CONTROL} />
        </div>
      </div>
      <ControlsTableToolbar
        handleExport={handleExportFile}
        handleClearSelectedControls={handleClearSelectedControls}
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        mappedColumns={mappedColumns}
        exportEnabled={controls && controls.length > 0}
        selectedControls={selectedControls}
        setSelectedControls={setSelectedControls}
        permission={permission}
        canEdit={canEdit}
      />
      <DataTable
        columns={columns}
        data={controls}
        defaultSorting={defaultSorting}
        onRowClick={handleRowClick}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        sortFields={CONTROLS_SORT_FIELDS}
        onSortChange={setOrderBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        loading={fetchingUsers || isLoading || isFetching}
        tableKey={TableKeyEnum.CONTROL}
      />
    </div>
  )
}

export default ControlsTable
