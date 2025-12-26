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
import { getCustomTagColumns, mapTagsToRows, TagNodeLike } from './custom-tags-table-config'
import { CreateTagSheet } from './create-tag-sheet'
import { useSmartRouter } from '@/hooks/useSmartRouter'

const CustomTagsTab: FC = () => {
  const { push } = useSmartRouter()
  const { successNotification, errorNotification } = useNotification()

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

  const rows = useMemo(() => mapTagsToRows((tags ?? []) as unknown as TagNodeLike[], debouncedSearch), [tags, debouncedSearch])

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

  const columns = useMemo(
    () =>
      getCustomTagColumns({
        rows,
        selected,
        setSelected,
        onEdit: handleEditOpen,
        onDelete: (id) => {
          const tag = rows.find((r) => r.id === id)
          setTagToDelete(tag ? { id: tag.id, name: tag.name } : null)
        },
      }),
    [rows, selected, setSelected, handleEditOpen],
  )

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
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

        <Button className="h-8 px-3 gap-2" onClick={handleCreateOpen}>
          <SquarePlus className="h-4 w-4" />
          Create Tag
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <DataTable
          columns={columns}
          data={rows}
          loading={isLoading}
          pagination={pagination}
          onPaginationChange={(p: TPagination) => setPagination(p)}
          paginationMeta={paginationMeta}
          tableKey={TableKeyEnum.CUSTOM_TAGS}
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
