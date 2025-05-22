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

type UserRow = {
  id: string
  displayName: string
  role: 'View' | 'Edit'
  user: User
}

export const ProgramSettingsAssignUserDialog = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [rows, setRows] = useState<UserRow[]>([])
  const [pagination, setPagination] = useState<TPagination>({ ...DEFAULT_PAGINATION, pageSize: 5, query: { first: 5 } })

  const { mutateAsync: updateProgram, isPending } = useUpdateProgram()

  const where = {
    hasUserWith: [
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
          checked={selectedUserIds.includes(row.original.id)}
          onCheckedChange={(checked) => {
            setSelectedUserIds((prev) => (checked ? [...prev, row.original.id] : prev.filter((id) => id !== row.original.id)))
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
        const userId = row.original.id
        const role = row.original.role

        return (
          <Select
            value={role}
            onValueChange={(val) => {
              setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role: val as 'View' | 'Edit' } : r)))
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
    if (!programId) return

    const selectedUsers = rows.filter((row) => selectedUserIds.includes(row.id))

    const addProgramMembers = selectedUsers.map((user) => ({
      userID: user.user.id,
      role: user.role === 'Edit' ? ProgramMembershipRole.ADMIN : ProgramMembershipRole.MEMBER,
      programID: programId,
    }))

    try {
      await updateProgram({
        updateProgramId: programId,
        input: {
          addProgramMembers,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['programMemberships'] })
    } catch (error) {}
  }

  return (
    <Dialog>
      <DialogTitle />
      <DialogTrigger asChild>
        <Button className="h-8 !px-2">Assign</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-4">Assign User</h2>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select one or more users to assign to this program.</p>

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
            <Button onClick={handleAssign} disabled={selectedUserIds.length === 0 || isPending}>
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
