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
import { useGetAllGroups } from '@/lib/graphql-hooks/groups' // Your provided hook

type GroupRow = {
  id: string
  name: string
  description?: string
}

export const ProgramSettingsAssignGroupDialog = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [rows, setRows] = useState<GroupRow[]>([])
  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    pageSize: 5,
    query: { first: 5 },
  })

  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()

  const where = {
    not: {
      or: [
        {
          hasProgramEditorsWith: [
            {
              id: programId,
            },
          ],
          hasProgramViewersWith: [
            {
              id: programId,
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

  const groups = useMemo(() => data?.groups?.edges?.map((edge) => edge?.node), [data])

  useEffect(() => {
    if (!!groups && !!groups.length) {
      const groupRows: GroupRow[] =
        (groups.map((group) => ({
          id: group?.id,
          name: group?.displayName || group?.name,
          description: group?.description,
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
      accessorKey: 'description',
      header: 'Description',
    },
  ]

  const handleAssign = async () => {
    if (!programId) return

    const groupIDs = selectedGroupIds

    try {
      await updateProgram({
        updateProgramId: programId,
        input: {
          addBlockedGroupIDs: groupIDs.map((groupID) => groupID),
        },
      })

      queryClient.invalidateQueries({ queryKey: ['programGroups'] })
    } catch (error) {
      console.error('Error assigning groups:', error)
    }
  }

  return (
    <Dialog>
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
