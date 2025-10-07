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
import { usePathname, useSearchParams } from 'next/navigation'
import { useGetApiTokens, useGetPersonalAccessTokens } from '@/lib/graphql-hooks/tokens'
import PersonalAccessTokensTableToolbar from '@/components/pages/protected/developers/table/personal-access-tokens-table-toolbar.tsx'
import { useMemo, useState, useEffect } from 'react'
import { TokenAction } from '@/components/pages/protected/developers/actions/pat-actions.tsx'
import { TOKEN_SORT_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDate, formatTimeSince } from '@/utils/date'
import { Alert, AlertDescription } from '@repo/ui/alert'
import { Button } from '@repo/ui/button'
import { X } from 'lucide-react'

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
  const searchParams = useSearchParams()
  const isOrg = path.includes('/organization-settings')
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [showTokenAuthorizedAlert, setShowTokenAuthorizedAlert] = useState(false)
  const [showTokenErrorAlert, setShowTokenErrorAlert] = useState(false)
  const [tokenErrorMessage, setTokenErrorMessage] = useState('')

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

  useEffect(() => {
    const tokenAuthorized = searchParams?.get('token_authorized')
    const error = searchParams?.get('error')

    if (tokenAuthorized === '1') {
      setShowTokenAuthorizedAlert(true)
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
    if (!errorMessage) {
      setShowTokenErrorAlert(false)
      return
    }

    setShowTokenErrorAlert(true)
    setTokenErrorMessage(errorMessage)
  }, [searchParams])

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
      cell: ({ cell }) => (
        <TokenAction
          tokenId={cell.getValue() as string}
          tokenName={cell.row.original.name}
          tokenDescription={cell.row.original.description}
          tokenExpiration={formatDate(cell.row.original.expiresAt)}
          tokenAuthorizedOrganizations={cell.row.original.organizations}
        />
      ),
    },
  ]

  return (
    <>
      {showTokenAuthorizedAlert && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Token successfully authorized via SSO!</span>
              <Button variant="outline" size="sm" onClick={() => setShowTokenAuthorizedAlert(false)} className="text-green-600 hover:text-green-800 h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {showTokenErrorAlert && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span className="font-medium">Token authorization failed: {tokenErrorMessage}</span>
              <Button variant="outline" size="sm" onClick={() => setShowTokenErrorAlert(false)} className="text-red-600 hover:text-red-800 h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
