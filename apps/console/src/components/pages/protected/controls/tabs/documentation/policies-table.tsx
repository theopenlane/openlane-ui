'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useDebounce } from '@uidotdev/usehooks'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { usePoliciesFilters } from '@/components/pages/protected/policies/table/table-config'
import { useDocumentationPolicies } from '@/lib/graphql-hooks/documentation'
import { InternalPolicyDocumentStatus, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema'
import type { GetInternalPoliciesListQueryVariables, InternalPolicyWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { AssociationSection, SearchFilterBar, buildAssociationFilter, mergeWhere } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { ColumnDef } from '@tanstack/react-table'
import { DocumentStatusBadge, DocumentStatusTooltips } from '@/components/shared/enum-mapper/policy-enum'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Avatar } from '@/components/shared/avatar/avatar'
import { KeyRound } from 'lucide-react'
import { formatTimeSince } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens'
import type { ApiToken, User } from '@repo/codegen/src/schema'
import type { AssociationRow } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'

type PoliciesTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const PoliciesTable: React.FC<PoliciesTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const filterFields = usePoliciesFilters()
  const filteredFields = useMemo(() => filterFields?.filter((field) => field.key !== 'hasControlsWith' && field.key !== 'hasSubcontrolsWith') ?? null, [filterFields])
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo(() => {
    const base: InternalPolicyWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const result = whereGenerator<InternalPolicyWhereInput>(filters as InternalPolicyWhereInput, (key, value) => {
      if (key === 'hasControlsWith' || key === 'hasSubcontrolsWith') {
        return {} as InternalPolicyWhereInput
      }
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as InternalPolicyWhereInput
      }
      return { [key]: value }
    })

    const hasStatusCondition = (obj: InternalPolicyWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    if (!hasStatusCondition(result)) {
      result.statusNotIn = [InternalPolicyDocumentStatus.ARCHIVED]
    }

    return mergeWhere<InternalPolicyWhereInput>([associationFilter as InternalPolicyWhereInput, base, result])
  }, [filters, debouncedSearch, associationFilter])

  const orderBy = useMemo<GetInternalPoliciesListQueryVariables['orderBy']>(() => [{ field: InternalPolicyOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { policies, paginationMeta, isLoading } = useDocumentationPolicies({
    where,
    orderBy,
    pagination,
    enabled: true,
  })

  const memberIds = useMemo(() => [...new Set(policies.map((policy) => policy.updatedBy).filter((id): id is string => typeof id === 'string' && id.length > 0))], [policies])

  const userListWhere = useMemo(() => (memberIds.length > 0 ? { hasUserWith: [{ idIn: memberIds }] } : undefined), [memberIds])

  const tokensWhere = useMemo(() => (memberIds.length > 0 ? { idIn: memberIds } : undefined), [memberIds])

  const { users } = useGetOrgUserList({ where: userListWhere })
  const { tokens } = useGetApiTokensByIds({ where: tokensWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      map[user.id] = user
    })
    return map
  }, [users])

  const tokenMap = useMemo(() => {
    const map: Record<string, ApiToken> = {}
    tokens?.forEach((token) => {
      map[token.id] = token
    })
    return map
  }, [tokens])

  const columns = useMemo<ColumnDef<AssociationRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: () => <span className="whitespace-nowrap">Name</span>,
        cell: ({ row }) => (
          <Link href={row.original.href} className="text-blue-500 hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: () => <span className="whitespace-nowrap">Status</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.status && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DocumentStatusBadge status={row.original.status as InternalPolicyDocumentStatus} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{DocumentStatusTooltips[row.original.status as InternalPolicyDocumentStatus]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: 'approver',
        header: () => <span className="whitespace-nowrap">Approver</span>,
        cell: ({ row }) => <span className="truncate">{row.original.approver?.displayName ?? '-'}</span>,
        size: 160,
      },
      {
        accessorKey: 'updatedBy',
        header: () => <span className="whitespace-nowrap">Last Updated By</span>,
        cell: ({ row }) => {
          const updatedBy = row.original.updatedBy ?? ''
          const user = userMap[updatedBy]
          const token = tokenMap[updatedBy]

          if (!user && !token) {
            return <span className="text-muted-foreground italic">Deleted user</span>
          }

          return (
            <div className="flex items-center gap-2">
              {token ? <KeyRound size={16} /> : <Avatar entity={user} className="w-6 h-6" />}
              <span>{token ? token.name : user?.displayName || '-'}</span>
            </div>
          )
        },
        size: 180,
      },
      {
        accessorKey: 'updatedAt',
        header: () => <span className="whitespace-nowrap">Last Updated</span>,
        cell: ({ row }) => <span className="whitespace-nowrap">{formatTimeSince(row.original.updatedAt)}</span>,
        size: 140,
      },
    ],
    [userMap, tokenMap],
  )

  const rows = useMemo(
    () =>
      policies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        status: policy.status ?? null,
        approver: policy.approver ?? null,
        updatedBy: policy.updatedBy ?? null,
        updatedAt: policy.updatedAt,
        href: `/policies/${policy.id}/view`,
      })),
    [policies],
  )

  return (
    <AssociationSection
      title="Internal Policies"
      rows={rows}
      columns={columns}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={paginationMeta}
      searchBar={
        <SearchFilterBar
          placeholder="Search policies"
          isSearching={search !== debouncedSearch}
          searchValue={search}
          onSearchChange={setSearch}
          filterFields={filteredFields}
          onFilterChange={setFilters}
        />
      }
    />
  )
}

export default PoliciesTable
