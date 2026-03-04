'use client'

import { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { type ColumnDef } from '@tanstack/react-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ProgramMembershipRole, type User } from '@repo/codegen/src/schema'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useDebounce } from '@uidotdev/usehooks'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TableKeyEnum } from '@repo/ui/table-key'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useSelectColumn } from '@/components/shared/crud-base/columns/select-column'

type UserRow = {
  id: string
  displayName: string
  user: User
}
const defaultPagination = { ...DEFAULT_PAGINATION, pageSize: 5, query: { first: 5 } }
export const ProgramSettingsAssignUserDialog = ({ trigger, id }: { trigger?: React.ReactNode; id: string }) => {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<{ id: string }[]>([])
  const [roleMap, setRoleMap] = useState<Record<string, 'View' | 'Edit'>>({})
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.PROGRAM_ASSIGN_USER, defaultPagination))

  const [searchValue, setSearchValue] = useState('')

  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()
  const { successNotification, errorNotification } = useNotification()

  const debouncedSearch = useDebounce(searchValue, 300)

  const where = {
    hasUserWith: [
      {
        displayNameContainsFold: debouncedSearch,
      },
      {
        not: {
          hasProgramMembershipsWith: [
            {
              programID: id,
            },
          ],
        },
      },
    ],
  }

  const { data, isLoading, isFetching } = useGetOrgMemberships({ where, pagination, enabled: !!id && open })

  const rows = useMemo(() => {
    if (!data?.orgMemberships?.edges) return []
    return data.orgMemberships.edges.map((edge) => ({
      id: edge?.node?.id,
      displayName: edge?.node?.user?.displayName,
      user: edge?.node?.user,
    })) as UserRow[]
  }, [data])

  const selectColumn = useSelectColumn<UserRow>(selectedItems, setSelectedItems)

  const userColumns: ColumnDef<UserRow>[] = useMemo(
    () => [
      selectColumn,
      {
        accessorKey: 'displayName',
        header: 'Name',
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
    ],
    [selectColumn, roleMap],
  )

  const handleAssign = async () => {
    const addProgramMembers = selectedItems.flatMap((item) => {
      const userRow = rows.find((r) => r.id === item.id)
      if (!userRow) return []
      const role = roleMap[item.id] ?? 'View'
      return [
        {
          userID: userRow.user.id,
          role: role === 'Edit' ? ProgramMembershipRole.ADMIN : ProgramMembershipRole.MEMBER,
        },
      ]
    })

    try {
      await updateProgram({
        updateProgramId: id,
        input: {
          addProgramMembers,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['programMemberships'] })
      queryClient.invalidateQueries({ queryKey: ['memberships'] })

      successNotification({
        title: 'Users Assigned',
        description: `${selectedItems.length} user(s) successfully assigned to the program.`,
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
    setPagination(defaultPagination)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle />
      <DialogTrigger asChild>{trigger ?? <Button className="h-8 px-2!">Assign</Button>}</DialogTrigger>

      <DialogContent className="max-w-2xl p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-1">Assign User</h2>

        <div className="space-y-4">
          <div className="flex flex-col justify-between">
            <p className="text-sm mb-4 text-muted-foreground">Select one or more users to assign to this program.</p>
            <div>
              <Label>Search</Label>
              <Input onChange={handleSearchChange} value={searchValue} placeholder="Search users ..." className="h-10 w-[200px]" />
            </div>
          </div>

          <DataTable
            columns={userColumns}
            data={rows}
            loading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationMeta={{
              totalCount: data?.orgMemberships?.totalCount ?? 0,
              pageInfo: data?.orgMemberships?.pageInfo,
              isLoading: isFetching,
            }}
            tableKey={TableKeyEnum.PROGRAM_ASSIGN_USER}
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
