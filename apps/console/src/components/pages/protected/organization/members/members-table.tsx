'use client'

import { OrgMembership, OrgMembershipRole, User, UserAuthProvider } from '@repo/codegen/src/schema'
import { pageStyles } from './page.styles'
import React, { useState, useEffect, Dispatch, SetStateAction, useMemo } from 'react'
import { Copy, KeyRoundIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { useCopyToClipboard, useDebounce } from '@uidotdev/usehooks'
import { MemberActions } from './actions/member-actions'
import { useNotification } from '@/hooks/useNotification'
import { Avatar } from '@/components/shared/avatar/avatar'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDateSince } from '@/utils/date'
import { UserRoleIconMapper } from '@/components/shared/icon-enum/user-role-enum.tsx'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members.ts'
import MembersTableToolbar from '@/components/pages/protected/organization/members/members-table-toolbar.tsx'

type MembersTableProps = {
  setActiveTab: Dispatch<SetStateAction<string>>
}

export const MembersTable = ({ setActiveTab }: MembersTableProps) => {
  const { nameRow, copyIcon } = pageStyles()
  const [filters, setFilters] = useState<Record<string, any> | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const { successNotification } = useNotification()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const whereFilters = useMemo(() => {
    if (!filters) {
      return undefined
    }

    const modifiedWhereFilters = { ...filters }
    const hasUserWithConditions: Record<string, any> = {
      displayNameContainsFold: debouncedSearch,
    }

    if ('providers' in modifiedWhereFilters) {
      hasUserWithConditions.authProviderIn = [modifiedWhereFilters.providers]
      delete modifiedWhereFilters.providers
    }

    const conditions: Record<string, any> = {
      ...modifiedWhereFilters,
      hasUserWith: [hasUserWithConditions],
    }

    return conditions
  }, [filters, debouncedSearch])

  const { members, isLoading, paginationMeta } = useGetOrgMemberships({ where: whereFilters, pagination, enabled: !!filters })

  useEffect(() => {
    if (copiedText) {
      successNotification({
        title: 'Copied to clipboard',
        variant: 'success',
      })
    }
  }, [copiedText])

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
      <MembersTableToolbar
        className="my-5"
        searching={isLoading}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        onSetActiveTab={setActiveTab}
      />

      <DataTable
        loading={isLoading}
        columns={columns}
        data={members}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
      />
    </div>
  )
}
