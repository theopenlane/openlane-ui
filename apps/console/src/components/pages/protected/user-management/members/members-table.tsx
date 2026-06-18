'use client'

import {
  OrderDirection,
  OrgMembershipRole,
  type OrgMembership,
  OrgMembershipOrderField,
  type OrgMembershipsQueryVariables,
  type OrgMembershipWhereInput,
  type User,
  UserAuthProvider,
} from '@repo/codegen/src/schema'
import { pageStyles } from './page.styles'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Copy, Info, KeyRoundIcon, Shield, ShieldOff } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
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

const SSO_EXEMPT_ROLES = [OrgMembershipRole.OWNER, OrgMembershipRole.AUDITOR]

function getSsoExemptReason(member: OrgMembership, exemptDomains: string[]): string | null {
  if (SSO_EXEMPT_ROLES.includes(member.role)) return 'Exempt due to Owner or Auditor role'
  const emailDomain = member.user?.email?.split('@')[1]?.toLowerCase()
  if (emailDomain && exemptDomains.some((d) => d.toLowerCase() === emailDomain)) return `Exempt via domain (${emailDomain})`
  if (member.ssoExempt) return 'Manually marked as SSO exempt'
  return null
}

export type ExtendedOrgMembershipWhereInput = OrgMembershipWhereInput & {
  providersIn?: UserAuthProvider[]
}

export const MembersTable = () => {
  const { nameRow, copyIcon } = pageStyles()
  const { data: sessionData } = useSession()
  const { currentOrgId } = useOrganization()
  const { data: orgSettingData } = useGetOrganizationSetting(currentOrgId || '')
  const orgSetting = orgSettingData?.organization?.setting
  const ssoEnforced = !!(orgSetting?.identityProvider && orgSetting.identityProvider !== 'NONE' && orgSetting.identityProviderLoginEnforced)
  const exemptDomains = orgSetting?.identityProviderExemptDomains ?? []
  const [filters, setFilters] = useState<ExtendedOrgMembershipWhereInput | null>(null)
  const [selectedIds, setSelectedIds] = useState<{ id: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [, copyToClipboard] = useCopyToClipboard()
  const { successNotification, errorNotification } = useNotification()
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.MEMBER, DEFAULT_PAGINATION))
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [orderBy, setOrderBy] = useState<OrgMembershipsQueryVariables['orderBy']>(() =>
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

  const ssoColumn: ColumnDef<OrgMembership> = {
    id: 'sso',
    header: 'SSO',
    cell: ({ row }) => {
      const reason = getSsoExemptReason(row.original, exemptDomains)
      if (!reason) {
        return (
          <Badge variant="primary" className="gap-1 text-xs">
            <Shield className="h-3 w-3" />
            Enforced
          </Badge>
        )
      }
      return (
        <SystemTooltip
          icon={
            <span className="cursor-default">
              <Badge variant="select" className="gap-1 text-xs pointer-events-none">
                <ShieldOff className="h-3 w-3" />
                Exempt
              </Badge>
            </span>
          }
          content={reason}
        />
      )
    },
    size: 120,
    maxSize: 120,
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
      minSize: 100,
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
      minSize: 120,
      size: 260,
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
      size: 80,
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
      size: 90,
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
      size: 110,
    },
    ssoColumn,
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
            ssoExempt={cell.row.original.ssoExempt ?? false}
          />
        )
      },
      size: 50,
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
        key={ssoEnforced ? 'sso-enforced' : 'sso-not-enforced'}
        loading={isLoading}
        columns={columns}
        sortFields={MEMBERS_SORT_FIELDS}
        onSortChange={setOrderBy}
        data={sortedMembers}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.MEMBER}
        columnVisibility={{ sso: ssoEnforced } as VisibilityState}
        setColumnVisibility={() => { }}
      />
    </div>
  )
}
