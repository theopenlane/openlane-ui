'use client'

import { OrderDirection, type OrgMembership, OrgMembershipOrderField, type OrgMembershipRole, type OrgMembershipWhereInput, type User, UserAuthProvider } from '@repo/codegen/src/schema'
import { pageStyles } from './page.styles'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Info, KeyRoundIcon } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { DataTable } from '@repo/ui/data-table'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { type ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { useCopyToClipboard, useDebounce } from '@uidotdev/usehooks'
import { useSession } from 'next-auth/react'
import { Badge } from '@repo/ui/badge'
import { useSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { MemberActions } from './actions/member-actions'
import { MembersBulkActions } from './actions/members-bulk-actions'
import { AdditionalRolesCell } from '@/components/shared/organization-roles/additional-roles-cell'
import { useNotification } from '@/hooks/useNotification'
import { Avatar } from '@/components/shared/avatar/avatar'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDateSince } from '@/utils/date'
import { UserRoleIconMapper } from '@/components/shared/enum-mapper/user-role-enum'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/member'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import MembersTableToolbar from '@/components/pages/protected/user-management/members/members-table-toolbar.tsx'
import { MEMBERS_SORT_FIELDS } from './table/table-config'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { TableKeyEnum } from '@repo/ui/table-key'
import { toHumanLabel } from '@/utils/strings'

export type ExtendedOrgMembershipWhereInput = OrgMembershipWhereInput & {
  providersIn?: UserAuthProvider[]
}

export const MembersTable = () => {
  const { nameRow, copyIcon } = pageStyles()
  const { data: sessionData } = useSession()
  const [filters, setFilters] = useState<ExtendedOrgMembershipWhereInput | null>(null)
  const [selectedIds, setSelectedIds] = useState<{ id: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [, copyToClipboard] = useCopyToClipboard()
  const { successNotification, errorNotification } = useNotification()
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.MEMBER, OrgMembershipOrderField, [
    {
      field: OrgMembershipOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  ])

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

  const { data: orgRoles } = useOrganizationRoles()
  const canEditMembers = canEdit(orgRoles?.roles)
  const currentUserId = sessionData?.user?.userId

  const isMemberSelectable = useCallback((member: OrgMembership) => !!currentUserId && member.user?.id !== currentUserId, [currentUserId])
  const selectColumn = useSelectColumn<OrgMembership>(selectedIds, setSelectedIds, isMemberSelectable)

  const selectedMembers = useMemo(() => members.filter((m) => selectedIds.some((s) => s.id === m.id)), [members, selectedIds])

  useEffect(() => {
    setSelectedIds([])
  }, [pagination.page, pagination.pageSize, debouncedSearch, filters, orderBy])

  const sortedMembers = useMemo(() => {
    if (!currentUserId) return members
    return [...members].sort((a, b) => {
      if (a.user?.id === currentUserId) return -1
      if (b.user?.id === currentUserId) return 1
      return 0
    })
  }, [members, currentUserId])

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
    ...(canEditMembers ? [selectColumn] : []),
    {
      accessorKey: 'user.displayName',
      header: 'Name',
      cell: ({ row }) => {
        const fullName = `${row.original.user.displayName}` || `${row.original.user.email}`
        const isCurrentUser = row.original.user?.id === currentUserId
        return (
          <div className={nameRow()}>
            <Avatar variant="small" entity={row.original.user as User} />
            {fullName}
            {isCurrentUser && <Badge variant="outline">me</Badge>}
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
      id: 'additionalRoles',
      header: () => (
        <span className="flex items-center gap-1.5">
          Additional Roles
          <SystemTooltip icon={<Info size={14} />} content={<p>Functional roles layered on top of the base role to grant specific access (e.g. Policy Manager, Risk Manager).</p>} />
        </span>
      ),
      cell: ({ row }) => <AdditionalRolesCell roles={row.original.additionalRoles} />,
      size: 180,
      minSize: 160,
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
        return (
          <div className="flex gap-2 items-center">
            {UserRoleIconMapper[role]}
            {toHumanLabel(role)}
          </div>
        )
      },
      size: 150,
      maxSize: 180,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ cell }) => {
        return (
          <MemberActions
            memberName={cell.row.original.user?.displayName}
            memberId={cell.row.original.id}
            memberUserId={cell.row.original.user?.id}
            memberRole={cell.row.original.role}
            additionalRoles={cell.row.original.additionalRoles}
          />
        )
      },
      size: 80,
    },
  ]

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="grow">
          <MembersTableToolbar
            searching={isLoading}
            setFilters={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={(inputVal) => {
              setSearchTerm(inputVal)
              setPagination(DEFAULT_PAGINATION)
            }}
            hideFilter={canEditMembers && selectedMembers.length > 0}
          />
        </div>
        {canEditMembers && selectedMembers.length > 0 && <MembersBulkActions selectedMembers={selectedMembers} onClear={() => setSelectedIds([])} />}
      </div>

      <DataTable
        loading={isLoading}
        columns={columns}
        sortFields={MEMBERS_SORT_FIELDS}
        sorting={orderBy}
        onSortChange={setOrderBy}
        data={sortedMembers}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.MEMBER}
      />
    </div>
  )
}
