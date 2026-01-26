'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { DataTable } from '@repo/ui/data-table'
import { useState, useMemo } from 'react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { useDebounce } from '@uidotdev/usehooks'
import { GroupWhereInput } from '@repo/codegen/src/schema'
import { useParams, usePathname } from 'next/navigation'
import { useGroupSelectionColumns } from './assign-permissions-table-config'
import { Group } from './assign-permissions-table-config'
import Pagination from '@repo/ui/pagination'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedures'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { SearchIcon } from 'lucide-react'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SaveButton } from '../save-button/save-button'
import { CancelButton } from '../cancel-button.tsx/cancel-button'

interface AssignPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignPermissionsDialog({ open, onOpenChange }: AssignPermissionsDialogProps) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const isProcedurePage = pathname.includes('/procedures')

  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 5 })
  const debouncedSearch = useDebounce(search, 300)

  const { mutateAsync: updatePolicy, isPending: isSavingPolicy } = useUpdateInternalPolicy()
  const { mutateAsync: updateProcedure, isPending: isSavingProcedure } = useUpdateProcedure()

  const config = useMemo(() => {
    if (isProcedurePage) {
      return {
        where: {
          not: {
            hasProcedureEditorsWith: [{ idIn: [id] }],
          },
          displayNameContainsFold: debouncedSearch,
        } satisfies GroupWhereInput,
        update: () =>
          updateProcedure({
            updateProcedureId: id,
            input: {
              addEditorIDs: selectedGroupIds,
            },
          }),
        invalidate: () => {
          queryClient.invalidateQueries({ queryKey: ['groups'] })
          queryClient.invalidateQueries({ queryKey: ['procedures'] })
        },
        isSaving: isSavingProcedure,
      }
    }
    return {
      where: {
        not: {
          hasInternalPolicyEditorsWith: [{ idIn: [id] }],
        },
        displayNameContainsFold: debouncedSearch,
      } satisfies GroupWhereInput,
      update: () =>
        updatePolicy({
          updateInternalPolicyId: id,
          input: {
            addEditorIDs: selectedGroupIds,
          },
        }),
      invalidate: () => {
        queryClient.invalidateQueries({ queryKey: ['groups'] })
        queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      },
      isSaving: isSavingPolicy,
    }
  }, [debouncedSearch, id, isProcedurePage, queryClient, selectedGroupIds, updatePolicy, updateProcedure, isSavingPolicy, isSavingProcedure])

  const { data, isLoading } = useGetAllGroups({ where: config.where })

  const groups: Group[] = useMemo(() => {
    return (data?.groups?.edges?.map((edge) => edge?.node).filter(Boolean) as Group[]) || []
  }, [data])

  const allGroupIds = useMemo(() => groups.map((g) => g?.id || ''), [groups])
  const columns = useGroupSelectionColumns(selectedGroupIds, setSelectedGroupIds, allGroupIds)

  const totalPages = Math.ceil(groups.length / pagination.pageSize)
  const startIndex = (pagination.page - 1) * pagination.pageSize
  const endIndex = pagination.page * pagination.pageSize
  const pageData = groups.slice(startIndex, endIndex)

  const handleSave = async () => {
    try {
      await config.update()
      successNotification({
        title: 'Permissions Assigned',
        description: 'Groups have been successfully added as editors.',
      })
      config.invalidate()
      onOpenChange(false)
    } catch {
      errorNotification({ title: 'Failed to assign permissions' })
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setSelectedGroupIds([])
    setSearch('')
    setPagination({ page: 1, pageSize: 5 })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedGroupIds([])
          setSearch('')
          setPagination({ page: 1, pageSize: 5 })
        }
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Assign permission</DialogTitle>
        </DialogHeader>

        <div className="pt-4 flex flex-col gap-2.5">
          <Input
            placeholder="Search ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon size={16} />}
            iconPosition="left"
            variant="searchTable"
            className="max-w-[204px]"
          />

          <DataTable columns={columns} data={pageData} loading={isLoading} showFilter={false} showVisibility={false} tableKey={TableKeyEnum.POLICY_PROCEDURE_ASSIGN_PERMISSION} />
          <Pagination
            currentPage={pagination.page}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) => setPagination((prev) => ({ ...prev, pageSize }))}
            pageSize={pagination.pageSize}
            totalPages={totalPages}
          />
        </div>

        <DialogFooter className="mt-6 flex justify-between">
          <CancelButton onClick={handleCancel}></CancelButton>
          <SaveButton isSaving={config.isSaving} disabled={selectedGroupIds.length === 0 || config.isSaving} onClick={handleSave} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
