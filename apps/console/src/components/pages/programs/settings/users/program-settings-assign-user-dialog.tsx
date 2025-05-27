'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members'
import { useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Checkbox } from '@repo/ui/checkbox'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ProgramMembershipRole, User } from '@repo/codegen/src/schema'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useDebounce } from '@uidotdev/usehooks'

type UserRow = {
  id: string
  displayName: string
  role: 'View' | 'Edit'
  user: User
}
const defaultPagination = { ...DEFAULT_PAGINATION, pageSize: 5, query: { first: 5 } }
export const ProgramSettingsAssignUserDialog = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const [selectedUsers, setSelectedUsers] = useState<UserRow[]>([])
  const [rows, setRows] = useState<UserRow[]>([])
  const [pagination, setPagination] = useState<TPagination>(defaultPagination)
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
              programID: programId,
            },
          ],
        },
      },
    ],
  }

  const { data, isLoading, isFetching } = useGetOrgMemberships({ where, pagination, enabled: !!programId })

  useEffect(() => {
    if (data?.orgMemberships?.edges) {
      const userRows: UserRow[] = data.orgMemberships.edges.map((edge) => ({
        id: edge?.node?.id,
        displayName: edge?.node?.user?.displayName,
        role: 'View',
        user: edge?.node?.user,
      })) as UserRow[]
      setRows(userRows)
    }
  }, [data])

  const userColumns: ColumnDef<UserRow>[] = [
    {
      id: 'select',
      header: '',
      cell: ({ row }) => (
        <Checkbox
          checked={selectedUsers.some((u) => u.id === row.original.id)}
          onCheckedChange={(checked) => {
            setSelectedUsers((prev) => {
              if (checked) {
                return [...prev, row.original]
              } else {
                return prev.filter((u) => u.id !== row.original.id)
              }
            })
          }}
        />
      ),
    },
    {
      accessorKey: 'displayName',
      header: 'Name',
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
              const userId = row.original.id
              setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: newRole } : r)))
              setSelectedUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
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
  ]

  const handleAssign = async () => {
    if (!programId) {
      errorNotification({
        title: 'Missing Program ID',
        description: 'Cannot assign users without a valid program ID.',
      })
      return
    }

    const addProgramMembers = selectedUsers.map((user) => ({
      userID: user.user.id,
      role: user.role === 'Edit' ? ProgramMembershipRole.ADMIN : ProgramMembershipRole.MEMBER,
    }))

    try {
      await updateProgram({
        updateProgramId: programId,
        input: {
          addProgramMembers,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['programMemberships'] })
      queryClient.invalidateQueries({ queryKey: ['memberships'] })

      successNotification({
        title: 'Users Assigned',
        description: `${selectedUsers.length} user(s) successfully assigned to the program.`,
      })

      setSelectedUsers([])
      setOpen(false)
    } catch {
      errorNotification({
        title: 'Failed to Assign Users',
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
      <DialogTrigger asChild>
        <Button className="h-8 !px-2">Assign</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-4">Assign User</h2>
        <div className="space-y-4">
          <div className="flex justify-between">
            <div>
              <Label>Search</Label>
              <Input onChange={handleSearchChange} value={searchValue} placeholder="Type program name ..." className="h-10 w-[200px]" />
            </div>
            <p className="text-sm text-muted-foreground self-end">Select one or more users to assign to this program.</p>
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
          />

          <div className="flex gap-2 mt-4 justify-end">
            <Button onClick={handleAssign} disabled={selectedUsers.length === 0 || isPending}>
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
