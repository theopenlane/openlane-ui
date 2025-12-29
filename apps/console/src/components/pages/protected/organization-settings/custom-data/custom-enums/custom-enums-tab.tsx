'use client'

import React, { FC, useState, useMemo, useCallback, useEffect } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { SquarePlus, LoaderCircle, Search as SearchIcon, LayoutGrid } from 'lucide-react'

import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useGetCustomEnumColumns, CustomEnumRow } from './custom-enums-table-config'
import { CreateEnumSheet } from './create-enum-sheet'
import { ENUM_GROUP_MAP, ENUM_GROUPS, getEnumFilter } from './custom-enums-config'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useCustomTypeEnumsPaginated, useDeleteCustomTypeEnum } from '@/lib/graphql-hooks/custom-type-enums'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TPagination } from '@repo/ui/pagination-types'

type SelectedEnum = { id: string; name: string }

const CustomEnumsTab: FC = () => {
  const { push } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()

  const [view, setView] = useState<string>(ENUM_GROUPS[0])
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)

  const [selectedEnums, setSelectedEnums] = useState<SelectedEnum[]>([])

  const [tagToDelete, setTagToDelete] = useState<{ id: string; name: string } | null>(null)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.CUSTOM_ENUMS, DEFAULT_PAGINATION))

  const whereFilter = useMemo(() => getEnumFilter(view, debouncedSearch), [debouncedSearch, view])

  const { enums, isLoading, paginationMeta, refetch } = useCustomTypeEnumsPaginated({
    pagination,
    where: whereFilter,
  })

  const { mutateAsync: deleteEnum, isPending: isDeleting } = useDeleteCustomTypeEnum()

  const rows = useMemo((): CustomEnumRow[] => {
    return enums.map((e) => ({
      id: e.id,
      name: e.name,
      enumGroup: e.objectType,
      type: e.systemOwned ? 'system' : 'custom',
      description: e.description ?? '',
      colorHex: e.color ?? '#000000',
    }))
  }, [enums])

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
  }, [debouncedSearch, view, resetPagination])

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return
    try {
      await deleteEnum(tagToDelete.id)
      successNotification({ title: 'Enum Deleted' })
      setTagToDelete(null)
      refetch()
    } catch (err) {
      errorNotification({ title: 'Error deleting', description: parseErrorMessage(err) })
    }
  }

  const columns = useGetCustomEnumColumns({
    selectedEnums,
    setSelectedEnums,
    onEdit: handleEditOpen,
    onDelete: (id) => {
      const item = rows.find((r) => r.id === id)
      if (item) setTagToDelete({ id: item.id, name: item.name })
    },
  })

  return (
    <>
      <div className="flex flex-col gap-4 mb-4 w-full">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <Select value={view} onValueChange={setView}>
              <SelectTrigger className="h-9 w-[220px] bg-card capitalize">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = ENUM_GROUP_MAP[view]?.icon || LayoutGrid
                      return <Icon size={16} className="text-muted-foreground" />
                    })()}
                    <span>{view.split('_').join(' ').toLowerCase()}</span>
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
            <Input
              icon={isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
              placeholder="Search enums..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.currentTarget.value)}
              variant="searchTable"
            />
            <Button className="h-8 px-3 gap-2" onClick={handleCreateOpen}>
              <SquarePlus className="h-4 w-4" />
              Create Enum
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <DataTable columns={columns} data={rows} loading={isLoading} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} tableKey={TableKeyEnum.CUSTOM_ENUMS} />
      </div>

      <CreateEnumSheet resetPagination={resetPagination} />

      <ConfirmationDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        title="Delete Enum Value"
        description={`Are you sure you want to delete "${tagToDelete?.name}"?`}
        confirmationText={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default CustomEnumsTab
