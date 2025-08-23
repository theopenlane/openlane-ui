'use client'

import {
  GetApiTokensQuery,
  GetApiTokensQueryVariables,
  GetPersonalAccessTokensQuery,
  GetPersonalAccessTokensQueryVariables,
  OrderDirection,
  PersonalAccessTokenOrderField,
} from '@repo/codegen/src/schema'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { usePathname } from 'next/navigation'
import { useGetApiTokens, useGetPersonalAccessTokens } from '@/lib/graphql-hooks/tokens'
import PersonalAccessTokensTableToolbar from '@/components/pages/protected/developers/table/personal-access-tokens-table-toolbar.tsx'
import { useMemo, useState } from 'react'
import { TokenAction } from '@/components/pages/protected/developers/actions/pat-actions.tsx'
import { TOKEN_SORT_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDate, formatTimeSince } from '@/utils/date'

type TokenNode = {
  id: string
  name: string
  description?: string
  expiresAt: string
  organizations?: { id: string; name: string }[]
  scopes?: string
}

export const PersonalAccessTokenTable = () => {
  const path = usePathname()
  const isOrg = path.includes('/organization-settings')
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  type CommonWhereType = GetPersonalAccessTokensQueryVariables['where'] | GetApiTokensQueryVariables['where']

  type CommonOrderByType = Array<{
    field: PersonalAccessTokenOrderField
    direction: OrderDirection
  }>

  const [filters, setFilters] = useState<CommonWhereType | null>(null)
  const [orderBy, setOrderBy] = useState<CommonOrderByType>([
    {
      field: PersonalAccessTokenOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  ])

  const whereFilter = useMemo(() => {
    return { ...filters } as CommonWhereType
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy.length > 0 ? orderBy : undefined
  }, [orderBy])

  const orgTokensResponse = useGetApiTokens({
    where: whereFilter,
    orderBy: orderByFilter as GetApiTokensQueryVariables['orderBy'],
    pagination,
    enabled: !!filters && isOrg,
  })

  const personalTokensResponse = useGetPersonalAccessTokens({
    where: whereFilter,
    orderBy: orderByFilter as GetPersonalAccessTokensQueryVariables['orderBy'],
    pagination,
    enabled: !!filters && !isOrg,
  })

  const data = isOrg ? orgTokensResponse.data : personalTokensResponse.data
  const isFetching = orgTokensResponse.isFetching || personalTokensResponse.isFetching

  const paginationMeta = useMemo(() => {
    const source = isOrg ? (data as GetApiTokensQuery)?.apiTokens : (data as GetPersonalAccessTokensQuery)?.personalAccessTokens

    return {
      totalCount: source?.totalCount ?? 0,
      pageInfo: source?.pageInfo,
      isLoading: isFetching,
    }
  }, [data, isOrg, isFetching])

  const tokens: TokenNode[] = isOrg
    ? (data as GetApiTokensQuery)?.apiTokens?.edges
        ?.map((edge) => edge?.node)
        .filter((node): node is NonNullable<typeof node> => !!node && !!node.id)
        .map((node) => ({
          id: node.id,
          name: node.name || 'Unnamed Token',
          description: node.description ?? undefined,
          expiresAt: node.expiresAt,
          lastUsedAt: node.lastUsedAt,
          scopes: node.scopes?.join(', ') || '-',
        })) || []
    : (data as GetPersonalAccessTokensQuery)?.personalAccessTokens?.edges
        ?.map((edge) => edge?.node)
        .filter((node): node is NonNullable<typeof node> => !!node && !!node.id)
        .map((node) => ({
          id: node.id,
          name: node.name!,
          description: node.description ?? undefined,
          expiresAt: node.expiresAt,
          lastUsedAt: node.lastUsedAt,
          organizations: node.organizations?.edges?.map((orgEdge) => orgEdge?.node).filter((org): org is { id: string; name: string } => !!org && !!org.id && !!org.name) || [],
        })) || []

  const columns: ColumnDef<TokenNode>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    isOrg
      ? {
          accessorKey: 'scopes',
          header: 'Scopes',
          cell: ({ cell }) => {
            const value = cell.getValue() as string
            return value || '-'
          },
        }
      : {
          accessorKey: 'organizations',
          header: 'Organization(s)',
          cell: ({ cell }) => {
            const value = cell.getValue() as { id: string; name: string }[]
            return value?.length ? value.map((org) => org.name).join(', ') : '-'
          },
        },

    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      cell: ({ cell }) => {
        const value = cell.getValue() as string | null
        return formatDate(value)
      },
    },
    {
      accessorKey: 'lastUsedAt',
      header: 'Last used',
      cell: ({ cell }) => {
        return formatTimeSince(cell.getValue() as string)
      },
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => <TokenAction tokenId={cell.getValue() as string} tokenName={cell.row.original.name} />,
    },
  ]

  return (
    <>
      <PersonalAccessTokensTableToolbar onFilterChange={setFilters} />
      <DataTable
        loading={isFetching}
        columns={columns}
        data={tokens}
        sortFields={TOKEN_SORT_FIELDS}
        onSortChange={setOrderBy}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
      />
    </>
  )
}
