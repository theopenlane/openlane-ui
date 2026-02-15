'use client'

import { OrderDirection, OrgMembership, OrgMembershipOrderField, OrgMembershipRole, OrgMembershipsQueryVariables, OrgMembershipWhereInput, User, UserAuthProvider } from '@repo/codegen/src/schema'
import { pageStyles } from './page.styles'
import React, { useEffect, useMemo, useState } from 'react'
import { Copy, KeyRoundIcon } from 'lucide-react'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { useCopyToClipboard, useDebounce } from '@uidotdev/usehooks'
import { MemberActions } from './actions/member-actions'
import { useNotification } from '@/hooks/useNotification'
import { Avatar } from '@/components/shared/avatar/avatar'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDateSince } from '@/utils/date'
import { UserRoleIconMapper } from '@/components/shared/enum-mapper/user-role-enum'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members.ts'
import MembersTableToolbar from '@/components/pages/protected/user-management/members/members-table-toolbar.tsx'
import { MEMBERS_SORT_FIELDS } from './table/table-config'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { TableKeyEnum } from '@repo/ui/table-key'

export type ExtendedOrgMembershipWhereInput = OrgMembershipWhereInput & {
  providersIn?: UserAuthProvider[]
}

export const MembersTable = () => {
  const { nameRow, copyIcon } = pageStyles()
  const [filters, setFilters] = useState<ExtendedOrgMembershipWhereInput | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [, copyToClipboard] = useCopyToClipboard()
  const { successNotification, errorNotification } = useNotification()
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.MEMBER, DEFAULT_PAGINATION))
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [orderBy, setOrderBy] = useState<OrgMembershipsQueryVariables['orderBy']>(
    getInitialSortConditions(TableKeyEnum.MEMBER, OrgMembershipOrderField, [
      {
        field: OrgMembershipOrderField.created_at,
        direction: OrderDirection.DESC,
      },
    ]),
  )

  const whereFilters: OrgMembershipWhereInput = useMemo(() => {
    const filtersWithSearch = {
      ...filters,
      and: [...(filters?.and ?? []), ...(debouncedSearch.trim() ? [{ hasUserWith: [{ displayNameContainsFold: debouncedSearch }] }] : [])],
    }

    const result = whereGenerator<OrgMembershipWhereInput>(filtersWithSearch, (key, value) => {
      if (key === 'authProviderIn') {
        return {
          hasUserWith: [{ authProviderIn: value as UserAuthProvider[] }],
        }
      }

      return { [key]: value } as OrgMembershipWhereInput
    })

    if (Array.isArray(result.and)) {
      const userClauses = result.and.filter((e) => Array.isArray(e.hasUserWith)) as Array<{ hasUserWith: Array<Record<string, unknown>> }>

      if (userClauses.length > 1) {
        const mergedInner = Object.assign({}, ...userClauses.map((e) => e.hasUserWith[0] ?? {}))

        result.and = [...result.and.filter((e) => !Array.isArray(e.hasUserWith)), { hasUserWith: [mergedInner] }]
      }
    }

    return result
  }, [filters, debouncedSearch])

  const { members, isError, isLoading, paginationMeta } = useGetOrgMemberships({ where: whereFilters, orderBy: orderBy, pagination, enabled: !!filters })

  const handleCopy = (text: string) => {
    copyToClipboard(text)
    successNotification({
      title: 'Copied to clipboard',
      variant: 'success',
    })
  }

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load members',
      })
    }
  }, [isError, errorNotification])

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
      accessorKey: 'user.displayName',
      header: 'Name',
      cell: ({ row }) => {
        const fullName = `${row.original.user.displayName}` || `${row.original.user.email}`
        return (
          <div className={nameRow()}>
            <Avatar variant="small" entity={row.original.user as User} />
            {fullName}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => handleCopy(fullName)} />
          </div>
        )
      },
      size: 200,
    },
    {
      accessorKey: 'user.email',
      header: 'Email',
      cell: ({ row }) => {
        return (
          <div className={nameRow()}>
            {row.original.user.email}
            <Copy width={16} height={16} className={copyIcon()} onClick={() => handleCopy(row.original.user.email)} />
          </div>
        )
      },
      size: 250,
      minSize: 250,
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ cell }) => formatDateSince(cell.getValue() as string),
      size: 120,
      minSize: 120,
    },
    {
      accessorKey: 'user.authProvider',
      header: 'Provider',
      cell: ({ cell }) => {
        const provider = cell.getValue() as UserAuthProvider
        const formattedProvider = provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()
        return (
          <div className={nameRow()}>
            {providerIcon(provider)}
            {formattedProvider}
          </div>
        )
      },
      size: 140,
      minSize: 140,
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ cell }) => {
        const role = cell.getValue() as OrgMembershipRole
        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
        return (
          <div className="flex gap-2 items-center">
            {UserRoleIconMapper[role]}
            {formattedRole}
          </div>
        )
      },
      size: 120,
      maxSize: 150,
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ cell }) => {
        return <MemberActions memberName={cell.row.original.user?.displayName} memberId={cell.row.original.id} memberUserId={cell.row.original.user?.id} memberRole={cell.row.original.role} />
      },
      size: 90,
      maxSize: 90,
    },
  ]

  return (
    <div>
      <MembersTableToolbar
        searching={isLoading}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
      />

      <DataTable
        loading={isLoading}
        columns={columns}
        sortFields={MEMBERS_SORT_FIELDS}
        onSortChange={setOrderBy}
        data={members}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.MEMBER}
      />
    </div>
  )
}
