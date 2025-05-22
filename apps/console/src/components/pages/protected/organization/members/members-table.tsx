'use client'

import { OrgMembership, OrgMembershipRole, User, UserAuthProvider } from '@repo/codegen/src/schema'
import { pageStyles } from './page.styles'
import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Copy, KeyRoundIcon, PlusIcon, Search } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { MemberActions } from './actions/member-actions'
import { useNotification } from '@/hooks/useNotification'
import { Avatar } from '@/components/shared/avatar/avatar'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDateSince } from '@/utils/date'
import { UserRoleIconMapper } from '@/components/shared/icon-enum/user-role-enum.tsx'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members.ts'

type MembersTableProps = {
  setActiveTab: Dispatch<SetStateAction<string>>
}

export const MembersTable = ({ setActiveTab }: MembersTableProps) => {
  const { membersSearchRow, membersSearchField, membersButtons, nameRow, copyIcon } = pageStyles()
  const [filteredMembers, setFilteredMembers] = useState<OrgMembership[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const { successNotification } = useNotification()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { data, isLoading, isFetching } = useGetOrgMemberships({ pagination })

  useEffect(() => {
    if (copiedText) {
      successNotification({
        title: 'Copied to clipboard',
        variant: 'success',
      })
    }
  }, [copiedText])

  useEffect(() => {
    if (data?.orgMemberships?.edges) {
      const memberNodes = data.orgMemberships.edges.map((edge) => edge?.node).filter(Boolean)
      setFilteredMembers(memberNodes as OrgMembership[])
    }
  }, [data])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase()
    setSearchTerm(searchValue)
    setPagination(DEFAULT_PAGINATION)

    if (data?.orgMemberships?.edges) {
      const memberNodes = data.orgMemberships.edges.map((edge) => edge?.node).filter(Boolean) as OrgMembership[]

      const filtered = memberNodes.filter(({ user }) => {
        const fullName = `${user?.firstName?.toLowerCase() ?? ''} ${user?.lastName?.toLowerCase() ?? ''}`
        return fullName.includes(searchValue)
      })

      setFilteredMembers(filtered as OrgMembership[])
    }
  }

  const providerIcon = (provider: UserAuthProvider) => {
    switch (provider) {
      case UserAuthProvider.GOOGLE:
        return <Image src="/icons/brand/google.svg" width={18} height={18} alt="" />
      case UserAuthProvider.GITHUB:
        return <Image src="/icons/brand/github.svg" width={18} height={18} alt="" />
      default:
        return <KeyRoundIcon width={18} />
    }
  }

  const columns: ColumnDef<OrgMembership>[] = [
    {
      accessorKey: 'user.id',
      header: '',
      cell: ({ row }) => {
        return <Avatar variant="small" entity={row.original.user as User} />
      },
      size: 40,
    },
    {
      accessorKey: 'user.displayName',
      header: 'Name',
      cell: ({ row }) => {
        const fullName = `${row.original.user.displayName}` || `${row.original.user.email}`
        return (
          <div className={nameRow()}>
            {fullName}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => copyToClipboard(fullName)} />
          </div>
        )
      },
    },
    {
      accessorKey: 'user.email',
      header: 'Email',
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ cell }) => formatDateSince(cell.getValue() as string),
    },
    {
      accessorKey: 'user.authProvider',
      header: 'Provider',
      cell: ({ cell }) => <>{providerIcon(cell.getValue() as UserAuthProvider)}</>,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ cell }) => {
        const role = cell.getValue() as OrgMembershipRole

        return (
          <div className="flex gap-2 items-center">
            {UserRoleIconMapper[role]}
            {role}
          </div>
        )
      },
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => {
        return <MemberActions memberId={cell.getValue() as string} memberUserId={cell.row.original.user?.id} memberRole={cell.row.original.role} />
      },
      size: 40,
    },
  ]

  return (
    <div>
      <div className={membersSearchRow()}>
        <div className={membersSearchField()}>
          <Input variant="searchTable" icon={<Search size={16} />} iconPosition="left" placeholder="Search for user" value={searchTerm} onChange={handleSearch} />
        </div>
        <div className={membersButtons()}>
          <Button size="md" icon={<PlusIcon />} iconPosition="left" onClick={() => setActiveTab('invites')}>
            Send an invite
          </Button>
        </div>
      </div>
      <DataTable
        loading={isLoading}
        columns={columns}
        data={filteredMembers}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={{ totalCount: data?.orgMemberships?.totalCount ?? 0, pageInfo: data?.orgMemberships?.pageInfo, isLoading: isFetching }}
      />
    </div>
  )
}
