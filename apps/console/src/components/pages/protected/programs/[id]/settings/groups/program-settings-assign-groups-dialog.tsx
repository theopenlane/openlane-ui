'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@repo/ui/checkbox'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useQueryClient } from '@tanstack/react-query'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { useNotification } from '@/hooks/useNotification'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useDebounce } from '@uidotdev/usehooks'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TableKeyEnum } from '@repo/ui/table-key'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type GroupRow = {
  id: string
  name: string
  description?: string
  role: 'View' | 'Edit'
}
export const ProgramSettingsAssignGroupDialog = () => {
  const { id } = useParams<{ id: string | undefined }>()

  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedGroups, setSelectedGroups] = useState<GroupRow[]>([])
  const [rows, setRows] = useState<GroupRow[]>([])
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.GROUP_PROGRAM_SETTINGS, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
      query: { first: 5 },
    }),
  )

  const debouncedSearch = useDebounce(searchValue, 300)

  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()
  const { successNotification, errorNotification } = useNotification()

  const where = {
    and: [
      { displayNameContainsFold: debouncedSearch },
      {
        not: {
          or: [
            {
              hasProgramEditorsWith: [
                {
                  idIn: [id!],
                },
              ],
            },
            {
              hasProgramViewersWith: [
                {
                  idIn: [id!],
                },
              ],
            },
          ],
        },
      },
    ],
  }

  const { data, paginationMeta, isLoading } = useGetAllGroups({
    where,
    pagination,
    enabled: !!id,
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
    } else {
      setRows([])
    }
  }, [groups])

  const groupColumns: ColumnDef<GroupRow>[] = [
    {
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={selectedGroups.some((g) => g.id === row.original.id)}
          onCheckedChange={(checked) => {
            setSelectedGroups((prev) => {
              if (checked) {
                return [...prev, row.original]
              } else {
                return prev.filter((g) => g.id !== row.original.id)
              }
            })
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
        const role = row.original.role

        return (
          <Select
            value={role}
            onValueChange={(val) => {
              const newRole = val as 'View' | 'Edit'
              const groupId = row.original.id

              setRows((prev) => prev.map((r) => (r.id === groupId ? { ...r, role: newRole } : r)))
              setSelectedGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, role: newRole } : g)))
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
      cell: ({ row }) => <div className="line-clamp-2 text-sm max-w-xs">{row.original.description}</div>,
    },
  ]

  const handleAssign = async () => {
    if (!id) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Cannot assign groups without a valid program ID.',
      })
      return
    }

    const addEditorIDs = selectedGroups.filter((g) => g.role === 'Edit').map((g) => g.id)

    const addViewerIDs = selectedGroups.filter((g) => g.role === 'View').map((g) => g.id)

    try {
      await updateProgram({
        updateProgramId: id,
        input: {
          addEditorIDs,
          addViewerIDs,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['groups', where] })
      queryClient.invalidateQueries({ queryKey: ['programs', id, 'groups'] })

      successNotification({
        title: 'Groups Assigned',
        description: `${selectedGroups.length} group(s) successfully assigned to the program.`,
      })

      setSelectedGroups([])
      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 })) // reset pagination on search
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle />
      <DialogTrigger asChild>
        <Button className="h-8 px-2!">Assign</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-1">Assign Group</h2>

        <div className="space-y-4">
          <div className="flex flex-col justify-between">
            <p className="text-sm mb-4">Select one or more groups to assign to this program.</p>
            <div>
              <Label>Search</Label>
              <Input value={searchValue} onChange={handleSearchChange} placeholder="Search groups..." className="h-10 w-[200px] mt-2" />
            </div>
          </div>

          <DataTable
            columns={groupColumns}
            data={rows}
            loading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationMeta={paginationMeta}
            tableKey={TableKeyEnum.GROUP_PROGRAM_SETTINGS}
          />

          <div className="flex gap-2 mt-4 justify-end">
            <Button onClick={handleAssign} disabled={selectedGroups.length === 0 || isPending}>
              {isPending ? 'Assigning...' : 'Assign'}
            </Button>
            <DialogTrigger asChild>
              <CancelButton />
            </DialogTrigger>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
