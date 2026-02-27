'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useQueryClient } from '@tanstack/react-query'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { useNotification } from '@/hooks/useNotification'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useDebounce } from '@uidotdev/usehooks'
import { Label } from '@repo/ui/label'
import { Input } from '@repo/ui/input'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TableKeyEnum } from '@repo/ui/table-key'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useSelectColumn } from '@/components/shared/crud-base/columns/select-column'

type GroupRow = {
  id: string
  name: string
  description?: string
}
export const ProgramSettingsAssignGroupDialog = () => {
  const { id } = useParams<{ id: string | undefined }>()

  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedItems, setSelectedItems] = useState<{ id: string }[]>([])
  const [roleMap, setRoleMap] = useState<Record<string, 'View' | 'Edit'>>({})
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

  const rows = useMemo(() => {
    const edges = data?.groups?.edges
    if (!edges?.length) return []
    return edges.map((edge) => ({
      id: edge?.node?.id,
      name: edge?.node?.displayName || edge?.node?.name,
      description: edge?.node?.description,
    })) as GroupRow[]
  }, [data])

  const selectColumn = useSelectColumn<GroupRow>(selectedItems, setSelectedItems)

  const groupColumns: ColumnDef<GroupRow>[] = useMemo(
    () => [
      selectColumn,
      {
        accessorKey: 'name',
        header: 'Group Name',
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = roleMap[row.original.id] ?? 'View'

          return (
            <Select
              value={role}
              onValueChange={(val) => {
                const newRole = val as 'View' | 'Edit'
                setRoleMap((prev) => ({ ...prev, [row.original.id]: newRole }))
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
    ],
    [selectColumn, roleMap],
  )

  const handleAssign = async () => {
    if (!id) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Cannot assign groups without a valid program ID.',
      })
      return
    }

    const addEditorIDs = selectedItems.filter((item) => (roleMap[item.id] ?? 'View') === 'Edit').map((item) => item.id)
    const addViewerIDs = selectedItems.filter((item) => (roleMap[item.id] ?? 'View') === 'View').map((item) => item.id)

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
        description: `${selectedItems.length} group(s) successfully assigned to the program.`,
      })

      setSelectedItems([])
      setRoleMap({})
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
            <Button onClick={handleAssign} disabled={selectedItems.length === 0 || isPending}>
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
