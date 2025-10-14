'use client'

import React, { useMemo, useState, useEffect, useContext } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { DataTable } from '@repo/ui/data-table'
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
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import TabSwitcher from '@/components/shared/control-switcher/tab-switcher.tsx'
import { useNotification } from '@/hooks/useNotification'

type TControlsTableProps = {
  active: 'report' | 'controls'
  setActive: (tab: 'report' | 'controls') => void
}

const ControlsTable: React.FC<TControlsTableProps> = ({ active, setActive }) => {
  const { push } = useRouter()
  const { convertToReadOnly } = usePlateEditor()
  const [filters, setFilters] = useState<ControlWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { data: session } = useSession()
  const { data: permission } = useOrganizationRole(session)
  const { handleExport } = useFileExport()
  const { errorNotification } = useNotification()
  const [orderBy, setOrderBy] = useState<GetAllControlsQueryVariables['orderBy']>([
    {
      field: ControlOrderField.ref_code,
      direction: OrderDirection.ASC,
    },
  ])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    referenceID: false,
    auditorReferenceID: false,
    category: false,
    subcategory: false,
    source: false,
    controlType: false,
    referenceFramework: false,
    delegate: false,
    createdBy: false,
    createdAt: false,
    updatedBy: false,
    updatedAt: false,
    controlImplementationsDetails: false,
    desiredOutcome: false,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string }[]>([])

  const whereFilter = useMemo(() => {
    const conditions: ControlWhereInput = {}

    const mapCustomKey = (key: string, value: string | string[]): Partial<ControlWhereInput> => {
      if (key === 'programContains') {
        return { hasProgramsWith: [{ nameContainsFold: value as string }] }
      }
      if (key === 'standardIn' && Array.isArray(value) && value[0] === 'CUSTOM') {
        return { referenceFrameworkIsNil: true }
      }
      if (key === 'standardIn' && Array.isArray(value)) {
        return { hasStandardWith: value.map((v) => ({ id: v })) }
      }

      return { [key]: value } as Partial<ControlWhereInput>
    }

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (!value) return

      if ((key === 'and' || key === 'or') && Array.isArray(value)) {
        conditions[key] = value.map((entry) => {
          const subCondition: ControlWhereInput = {}
          Object.entries(entry).forEach(([innerKey, innerValue]) => {
            Object.assign(subCondition, mapCustomKey(innerKey, innerValue as string))
          })
          return subCondition
        })
      } else {
        Object.assign(conditions, mapCustomKey(key, value))
      }
    })

    const hasStatusCondition = (obj: ControlWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj) return true

      if (Array.isArray(obj.and)) {
        if (obj.and.some(hasStatusCondition)) return true
      }

      if (Array.isArray(obj.or)) {
        if (obj.or.some(hasStatusCondition)) return true
      }

      return false
    }

    if (!hasStatusCondition(conditions)) {
      conditions.statusNEQ = ControlControlStatus.ARCHIVED
    }

    return conditions
  }, [filters])

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
    where: { ownerIDNEQ: '', refCodeContainsFold: debouncedSearch, ...whereFilter },
    orderBy,
    pagination,
    enabled: !!filters,
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

  const columns = useMemo(() => getControlColumns({ convertToReadOnly, userMap, selectedControls, setSelectedControls }), [convertToReadOnly, userMap, selectedControls])

  const mappedColumns: { accessorKey: string; header: string }[] = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && typeof column.header === 'string')
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
      filters: JSON.stringify(filters),
      fields: columns.filter(isVisibleColumn).map((item) => item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  const handleBulkEdit = () => {
    setSelectedControls([])
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl tracking-[-0.056rem] text-header">Controls</h1>
          <TabSwitcher active={active} setActive={setActive} />
        </div>
      </div>
      <ControlsTableToolbar
        handleExport={handleExportFile}
        handleBulkEdit={handleBulkEdit}
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
        onRowClick={handleRowClick}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        sortFields={CONTROLS_SORT_FIELDS}
        onSortChange={setOrderBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        loading={fetchingUsers || isLoading || isFetching}
      />
    </div>
  )
}

export default ControlsTable
