'use client'

import {
  GetApiTokensQuery,
  GetApiTokensQueryVariables,
  GetPersonalAccessTokensQuery,
  GetPersonalAccessTokensQueryVariables,
  OrderDirection,
  PersonalAccessTokenOrderField,
} from '@repo/codegen/src/schema'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { usePathname, useSearchParams } from 'next/navigation'
import { useGetApiTokens, useGetPersonalAccessTokens } from '@/lib/graphql-hooks/tokens'
import PersonalAccessTokensTableToolbar from '@/components/pages/protected/developers/table/personal-access-tokens-table-toolbar.tsx'
import { useMemo, useState, useEffect } from 'react'
import { TokenAction } from '@/components/pages/protected/developers/actions/pat-actions.tsx'
import { TOKEN_SORT_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDate, formatTimeSince } from '@/utils/date'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'

type TokenNode = {
  id: string
  name: string
  description?: string
  expiresAt: string
  organizations?: { id: string; name: string }[]
  scopes?: string
  ssoAuthorizations?: Record<string, string> | null
}

export const PersonalAccessTokenTable = () => {
  const path = usePathname()
  const searchParams = useSearchParams()
  const isApiTokenPage = path.includes('/api-tokens')
  const tableKey = isApiTokenPage ? TableKeyEnum.API_TOKEN : TableKeyEnum.PERSONAL_ACCESS_TOKEN
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(tableKey, DEFAULT_PAGINATION))
  const { successNotification, errorNotification } = useNotification()

  type CommonWhereType = GetPersonalAccessTokensQueryVariables['where'] | GetApiTokensQueryVariables['where']

  type CommonOrderByType = Array<{
    field: PersonalAccessTokenOrderField
    direction: OrderDirection
  }>

  const [filters, setFilters] = useState<CommonWhereType | null>(null)
  const defaultSorting = getInitialSortConditions(tableKey, PersonalAccessTokenOrderField, [
    {
      field: PersonalAccessTokenOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  ])
  const [orderBy, setOrderBy] = useState<CommonOrderByType>(defaultSorting)

  const whereFilter = useMemo(() => {
    return { ...filters } as CommonWhereType
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy.length > 0 ? orderBy : undefined
  }, [orderBy])

  useEffect(() => {
    const tokenAuthorized = searchParams?.get('token_authorized')
    const error = searchParams?.get('error')

    if (tokenAuthorized === '1') {
      successNotification({
        title: 'Success!',
        description: `Token successfully authorized via SSO!`,
      })
      return
    }

    const errorMessagesMap = {
      sso_signin_failed: 'SSO sign-in failed during token authorization',
      sso_callback_failed: 'SSO callback failed during token authorization',
      sso_callback_error: 'SSO callback error occurred during token authorization',
      missing_oauth_params: 'Missing OAuth parameters during token authorization',
      missing_organization_id: 'Missing organization ID during token authorization',
    }

    const errorMessage = errorMessagesMap[error as keyof typeof errorMessagesMap]
    if (errorMessage) {
      errorNotification({
        title: 'Error',
        description: `Token authorization failed: ${errorMessage}`,
      })
      return
    }
  }, [searchParams, errorNotification, successNotification])

  const {
    data: orgTokensResponse,
    isError: isApiTokensResponseError,
    isFetching: isFetchingApiTokens,
  } = useGetApiTokens({
    where: whereFilter,
    orderBy: orderByFilter as GetApiTokensQueryVariables['orderBy'],
    pagination,
    enabled: !!filters && isApiTokenPage,
  })

  const {
    data: personalTokensResponse,
    isError: isPersonalTokensResponseError,
    isFetching: isFetchingPersonalAccessTokens,
  } = useGetPersonalAccessTokens({
    where: whereFilter,
    orderBy: orderByFilter as GetPersonalAccessTokensQueryVariables['orderBy'],
    pagination,
    enabled: !!filters && !isApiTokenPage,
  })

  const data = isApiTokenPage ? orgTokensResponse : personalTokensResponse
  const isFetching = isFetchingApiTokens || isFetchingPersonalAccessTokens
  const isAnyError = isApiTokensResponseError || isPersonalTokensResponseError

  useEffect(() => {
    if (isAnyError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load tokens',
      })
    }
  }, [isAnyError, errorNotification])

  const paginationMeta = useMemo(() => {
    const source = isApiTokenPage ? (data as GetApiTokensQuery)?.apiTokens : (data as GetPersonalAccessTokensQuery)?.personalAccessTokens

    return {
      totalCount: source?.totalCount ?? 0,
      pageInfo: source?.pageInfo,
      isLoading: isFetching,
    }
  }, [data, isApiTokenPage, isFetching])

  const tokens: TokenNode[] = isApiTokenPage
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
          ssoAuthorizations: node.ssoAuthorizations || null,
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
          ssoAuthorizations: node.ssoAuthorizations || null,
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
    isApiTokenPage
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
      cell: ({ cell }) => (
        <TokenAction
          tokenId={cell.getValue() as string}
          tokenName={cell.row.original.name}
          tokenSsoAuthorizations={cell.row.original.ssoAuthorizations}
          tokenDescription={cell.row.original.description}
          tokenExpiration={formatDate(cell.row.original.expiresAt)}
          tokenAuthorizedOrganizations={cell.row.original.organizations}
        />
      ),
    },
  ]

  return (
    <>
      <PersonalAccessTokensTableToolbar onFilterChange={setFilters} />
      <DataTable
        defaultSorting={defaultSorting}
        loading={isFetching}
        columns={columns}
        data={tokens}
        sortFields={TOKEN_SORT_FIELDS}
        onSortChange={setOrderBy}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={tableKey}
      />
    </>
  )
}
