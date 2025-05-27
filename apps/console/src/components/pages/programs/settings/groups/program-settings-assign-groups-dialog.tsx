'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useQueryClient } from '@tanstack/react-query'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { useNotification } from '@/hooks/useNotification'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'

type GroupRow = {
  id: string
  name: string
  description?: string
  role: 'View' | 'Edit'
}
export const ProgramSettingsAssignGroupDialog = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [rows, setRows] = useState<GroupRow[]>([])
  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    pageSize: 5,
    query: { first: 5 },
  })

  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()
  const { successNotification, errorNotification } = useNotification()

  const where = {
    not: {
      or: [
        {
          hasProgramEditorsWith: [
            {
              idIn: [programId!],
            },
          ],
        },
        {
          hasProgramViewersWith: [
            {
              idIn: [programId!],
            },
          ],
        },
      ],
    },
  }

  const { data, paginationMeta, isLoading } = useGetAllGroups({
    where,
    pagination,
    enabled: !!programId,
  })

  const groups = useMemo(() => data?.groups?.edges?.map((edge) => edge?.node) || [], [data])
  useEffect(() => {
    if (!!groups && groups?.length) {
      const groupRows: GroupRow[] =
        (groups.map((group) => ({
          id: group?.id,
          name: group?.displayName || group?.name,
          description: group?.description,
          role: 'View',
        })) as GroupRow[]) || []
      setRows(groupRows)
    }
  }, [groups])

  const groupColumns: ColumnDef<GroupRow>[] = [
    {
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={selectedGroupIds.includes(row.original.id)}
          onCheckedChange={(checked) => {
            setSelectedGroupIds((prev) => (checked ? [...prev, row.original.id] : prev.filter((id) => id !== row.original.id)))
          }}
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Group Name',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const groupId = row.original.id
        const role = row.original.role

        return (
          <Select
            value={role}
            onValueChange={(val) => {
              setRows((prev) => prev.map((r) => (r.id === groupId ? { ...r, role: val as 'View' | 'Edit' } : r)))
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="View">View</SelectItem>
              <SelectItem value="Edit">Edit</SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
  ]

  const handleAssign = async () => {
    if (!programId) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Cannot assign groups without a valid program ID.',
      })
      return
    }

    const selectedGroups = rows.filter((row) => selectedGroupIds.includes(row.id))

    const addEditorIDs = selectedGroups.filter((g) => g.role === 'Edit').map((g) => g.id)

    const addViewerIDs = selectedGroups.filter((g) => g.role === 'View').map((g) => g.id)

    try {
      await updateProgram({
        updateProgramId: programId,
        input: {
          addBlockedGroupIDs: selectedGroupIds,
          addEditorIDs,
          addViewerIDs,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['groups', where] })
      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'groups'] })

      successNotification({
        title: 'Groups Assigned',
        description: `${selectedGroups.length} group(s) successfully assigned to the program.`,
      })

      setSelectedGroupIds([])
      setOpen(false)
    } catch {
      errorNotification({
        title: 'Failed to Assign Groups',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle />
      <DialogTrigger asChild>
        <Button className="h-8 !px-2">Assign Group</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-4">Assign Group</h2>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select one or more groups to assign to this program.</p>

          <DataTable columns={groupColumns} data={rows} loading={isLoading} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} />

          <div className="flex gap-2 mt-4 justify-end">
            <Button onClick={handleAssign} disabled={selectedGroupIds.length === 0 || isPending}>
              {isPending ? 'Assigning...' : 'Assign'}
            </Button>
            <DialogTrigger asChild>
              <Button variant="back">Cancel</Button>
            </DialogTrigger>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
