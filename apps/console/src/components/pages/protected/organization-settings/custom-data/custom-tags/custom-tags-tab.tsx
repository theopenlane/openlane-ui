'use client'

import { useDebounce } from '@uidotdev/usehooks'
import { SquarePlus, LoaderCircle, Search as SearchIcon } from 'lucide-react'
import { FC, useEffect, useMemo, useState, useCallback } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useTagsPaginated, useDeleteTag } from '@/lib/graphql-hooks/tags'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useGetCustomTagColumns } from './custom-tags-table-config'
import { CreateTagSheet } from './create-tag-sheet'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys'
import { VisibilityState } from '@tanstack/react-table'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canDelete, canEdit } from '@/lib/authz/utils'

const DEFAULT_TAGS_COLUMN_VISIBILITY: VisibilityState = {
  type: false,
  createdBy: false,
  createdAt: false,
  updatedBy: false,
  updatedAt: false,
}

const CustomTagsTab: FC = () => {
  const { push } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useOrganizationRoles()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.CUSTOM_TAGS, DEFAULT_TAGS_COLUMN_VISIBILITY))

  const [searchValue, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(searchValue, 300)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [tagToDelete, setTagToDelete] = useState<{ id: string; name: string } | null>(null)

  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.CUSTOM_TAGS, {
      ...DEFAULT_PAGINATION,
      pageSize: 10,
      query: { first: 10 },
    }),
  )

  const { tags, isLoading, isError, paginationMeta } = useTagsPaginated({
    pagination,
    enabled: true,
    where: { nameContainsFold: debouncedSearch },
  })

  const { mutateAsync: deleteTag, isPending: isDeleting } = useDeleteTag()

  const userIds = useMemo(() => {
    if (!tags.length) return []
    const ids = new Set<string>()
    tags.forEach((tag) => {
      if (tag.createdBy) ids.add(tag.createdBy)
      if (tag.updatedBy) ids.add(tag.updatedBy)
    })
    return Array.from(ids)
  }, [tags])

  const { users } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[number]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
      page: 1,
      query: { ...prev.query, after: undefined, before: undefined, first: prev.pageSize },
    }))
  }, [])

  useEffect(() => {
    setSelected({})
    resetPagination()
  }, [debouncedSearch, resetPagination])

  const handleCreateOpen = () => push({ create: 'true' })
  const handleEditOpen = useCallback((id: string) => push({ id }), [push])

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return
    try {
      await deleteTag({ deleteTagDefinitionId: tagToDelete.id })
      successNotification({ title: 'Tag Deleted' })
      setTagToDelete(null)
      resetPagination()
    } catch (err) {
      errorNotification({ title: 'Error deleting', description: parseErrorMessage(err) })
    }
  }

  const canEditTags = canEdit(permission?.roles)
  const canDeleteTags = canDelete(permission?.roles)

  const { columns, mappedColumns } = useGetCustomTagColumns({
    tags: tags,
    selected,
    setSelected,
    onEdit: handleEditOpen,
    onDelete: (id) => {
      const tag = tags.find((t) => t?.id === id)
      setTagToDelete(tag ? { id: tag.id, name: tag.name } : null)
    },
    userMap,
    canEditTags,
    canDeleteTags,
  })

  return (
    <>
      <div className="flex items-center justify-end gap-3 mb-4">
        <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableColumnVisibilityKeysEnum.CUSTOM_TAGS} />

        <Input
          icon={isLoading ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search tags..."
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.currentTarget.value)
            setPagination((prev) => ({ ...prev, pageIndex: 0, page: 1 }))
          }}
          variant="searchTable"
        />

        {canEditTags && (
          <Button className="gap-2" onClick={handleCreateOpen} icon={<SquarePlus />} iconPosition="left">
            Create Tag
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card">
        <DataTable
          columns={columns}
          data={tags}
          loading={isLoading}
          pagination={pagination}
          onPaginationChange={(p: TPagination) => setPagination(p)}
          paginationMeta={paginationMeta}
          tableKey={TableKeyEnum.CUSTOM_TAGS}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />
      </div>

      {isError && <div className="text-sm text-destructive mt-2">Failed to load tags.</div>}

      <CreateTagSheet resetPagination={resetPagination} />

      <ConfirmationDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        title="Delete Tag"
        description={`Are you sure you want to delete "${tagToDelete?.name}"? This action cannot be undone.`}
        confirmationText={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

export default CustomTagsTab
