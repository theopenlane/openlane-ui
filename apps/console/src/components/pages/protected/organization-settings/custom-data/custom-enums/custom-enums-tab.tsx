'use client'

import React, { FC, useState, useMemo, useCallback, useEffect } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { SquarePlus, LoaderCircle, Search as SearchIcon, LayoutGrid } from 'lucide-react'

import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { DataTable, getInitialPagination, getInitialSortConditions } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

import { useSmartRouter } from '@/hooks/useSmartRouter'
import { CUSTOM_ENUMS_SORT_FIELDS, useGetCustomEnumColumns } from './custom-enums-table-config'
import { CreateEnumSheet } from './create-enum-sheet'
import { ENUM_GROUP_MAP, ENUM_GROUPS, getEnumFilter } from './custom-enums-config'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useCustomTypeEnumsPaginated, useDeleteCustomTypeEnum } from '@/lib/graphql-hooks/custom-type-enums'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TPagination } from '@repo/ui/pagination-types'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { VisibilityState } from '@tanstack/react-table'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys'
import { CustomTypeEnumOrderField, GetCustomTypeEnumsPaginatedQueryVariables, OrderDirection, User } from '@repo/codegen/src/schema'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'

type SelectedEnum = { id: string; name: string }

const DEFAULT_ENUM_COLUMN_VISIBILITY: VisibilityState = {
  objectType: false,
  field: false,
  createdBy: false,
  createdAt: false,
  updatedBy: false,
  updatedAt: false,
}

const CustomEnumsTab: FC = () => {
  const { push } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.CUSTOM_ENUMS, DEFAULT_ENUM_COLUMN_VISIBILITY))
  const defaultSorting = getInitialSortConditions(TableKeyEnum.CUSTOM_ENUMS, CustomTypeEnumOrderField, [
    {
      field: CustomTypeEnumOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<GetCustomTypeEnumsPaginatedQueryVariables['orderBy']>(defaultSorting)

  const [filter, setFilter] = useState<string>(ENUM_GROUPS[1])
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)

  const [selectedEnums, setSelectedEnums] = useState<SelectedEnum[]>([])
  const [enumToDelete, setEnumToDelete] = useState<{ id: string; name: string } | null>(null)

  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.CUSTOM_ENUMS, DEFAULT_PAGINATION))

  const whereFilter = useMemo(() => getEnumFilter(filter, debouncedSearch), [debouncedSearch, filter])

  const { enums, isLoading, paginationMeta, refetch } = useCustomTypeEnumsPaginated({
    pagination,
    where: whereFilter,
    orderBy,
  })

  const { mutateAsync: deleteEnum, isPending: isDeleting } = useDeleteCustomTypeEnum()

  const handleCreateOpen = () => push({ create: 'true' })
  const handleEditOpen = useCallback((id: string) => push({ id }), [push])

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { ...prev.query, after: undefined, before: undefined },
    }))
  }, [])

  useEffect(() => {
    resetPagination()
  }, [debouncedSearch, filter, resetPagination])

  const handleDeleteConfirm = async () => {
    if (!enumToDelete) return
    try {
      await deleteEnum(enumToDelete.id)
      successNotification({ title: 'Enum Deleted' })
      setEnumToDelete(null)
      refetch()
    } catch (err) {
      errorNotification({ title: 'Error deleting', description: parseErrorMessage(err) })
    }
  }

  const userIds = useMemo(() => {
    if (!enums.length) return []
    const ids = new Set<string>()
    enums.forEach((e) => {
      if (e.createdBy) ids.add(e.createdBy)
      if (e.updatedBy) ids.add(e.updatedBy)
    })
    return Array.from(ids)
  }, [enums])

  const { users } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const { columns, mappedColumns } = useGetCustomEnumColumns({
    selectedEnums,
    setSelectedEnums,
    onEdit: handleEditOpen,
    onDelete: (id) => {
      const item = enums.find((e) => e.id === id)
      if (item) setEnumToDelete({ id: item.id, name: item.name })
    },
    userMap,
  })

  return (
    <>
      <div className="flex flex-col gap-4 mb-4 w-full">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-[220px] bg-card capitalize">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = ENUM_GROUP_MAP[filter]?.icon || LayoutGrid
                      return <Icon size={16} className="text-muted-foreground" />
                    })()}
                    <span>{filter.split('_').join(' ').toLowerCase()}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ENUM_GROUPS.map((groupKey) => {
                  const config = ENUM_GROUP_MAP[groupKey]
                  const Icon = config.icon
                  return (
                    <SelectItem key={groupKey} value={groupKey} className="capitalize">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-muted-foreground" />
                        <span>{config.label.toLowerCase()}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableColumnVisibilityKeysEnum.CUSTOM_ENUMS} />

            <Input
              icon={isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
              placeholder="Search enums..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.currentTarget.value)}
              variant="searchTable"
            />

            <Button className="gap-2" onClick={handleCreateOpen} icon={<SquarePlus />} iconPosition="left">
              Create Enum
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <DataTable
          columns={columns}
          data={enums}
          loading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={paginationMeta}
          tableKey={TableKeyEnum.CUSTOM_ENUMS}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          sortFields={CUSTOM_ENUMS_SORT_FIELDS}
          onSortChange={setOrderBy}
          defaultSorting={defaultSorting}
        />
      </div>

      <CreateEnumSheet resetPagination={resetPagination} filter={filter} />

      <ConfirmationDialog
        open={!!enumToDelete}
        onOpenChange={(open) => !open && setEnumToDelete(null)}
        title="Delete Enum Value"
        description={`Are you sure you want to delete "${enumToDelete?.name}"?`}
        confirmationText={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default CustomEnumsTab
