'use client'

import {
  type GetApiTokensQuery,
  type GetApiTokensQueryVariables,
  type GetPersonalAccessTokensQuery,
  type GetPersonalAccessTokensQueryVariables,
  OrderDirection,
  PersonalAccessTokenOrderField,
} from '@repo/codegen/src/schema'
import { DataTable, TruncatedCell } from '@repo/ui/data-table'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Callout } from '@/components/shared/callout/callout'
import { TriangleAlert } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { usePathname, useSearchParams } from 'next/navigation'
import { useGetApiTokens, useGetPersonalAccessTokens } from '@/lib/graphql-hooks/tokens'
import TokensTableToolbar from '@/components/pages/protected/developers/table/personal-access-tokens-table-toolbar.tsx'
import { useMemo, useState, useEffect } from 'react'
import { TokenAction } from '@/components/pages/protected/developers/actions/pat-actions.tsx'
import { TOKEN_SORT_FIELDS } from '@/components/pages/protected/developers/table/table-config.ts'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { formatDate, formatTimeSince } from '@/utils/date'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'
import PersonalApiKeyDialog, { type EditTokenData } from '@/components/pages/protected/developers/personal-access-token-crud-slideout'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useSession } from 'next-auth/react'

type TokenNode = {
  id: string
  name: string
  description?: string
  expiresAt: string | null
  organizations?: { id: string; name: string }[]
  scopes?: string[]
  ssoAuthorizations?: Record<string, string> | null
}

const VISIBLE_SCOPES = 3
const SCOPE_ACTION_ORDER = ['read', 'write', 'delete']
const sortScopeActions = (a: string, b: string) => {
  const ai = SCOPE_ACTION_ORDER.indexOf(a)
  const bi = SCOPE_ACTION_ORDER.indexOf(b)
  if (ai === -1 && bi === -1) return a.localeCompare(b)
  if (ai === -1) return 1
  if (bi === -1) return -1
  return ai - bi
}

type ScopesCellContentProps = {
  scopes: string[]
  token: TokenNode
}

const ScopesCellContent = ({ scopes, token }: ScopesCellContentProps) => {
  const [open, setOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const visible = scopes.slice(0, VISIBLE_SCOPES)
  const hiddenCount = scopes.length - VISIBLE_SCOPES

  const grouped = scopes.reduce<Record<string, string[]>>((acc, scope) => {
    const colon = scope.indexOf(':')
    const resource = colon === -1 ? scope : scope.slice(0, colon)
    const action = colon === -1 ? '' : scope.slice(colon + 1)
    ;(acc[resource] ??= []).push(action)
    return acc
  }, {})

  const groupedEntries = Object.entries(grouped)
  const useColumns = groupedEntries.length > 5
  const half = Math.ceil(groupedEntries.length / 2)

  const elevatedScopeCount = scopes.filter((s) => s.endsWith(':write') || s.endsWith(':delete')).length
  const hasExcessiveScopes = elevatedScopeCount > 20

  const editTokenData: EditTokenData = {
    id: token.id,
    name: token.name,
    description: token.description,
    expiresAt: token.expiresAt,
    authorizedOrganizations: token.organizations,
    scopes: token.scopes,
  }

  const renderScopes = (entries: [string, string[]][], cols: boolean, splitAt: number) => {
    const left = cols ? entries.slice(0, splitAt) : entries
    const right = cols ? entries.slice(splitAt) : []

    return (
      <table className="font-mono text-xs">
        <tbody>
          {left.map(([resource, actions], i) => {
            const rightEntry = right[i]
            return (
              <tr key={resource}>
                <td className="text-muted-foreground pr-6 py-0.5 whitespace-nowrap align-top">{resource}</td>
                <td className="py-0.5 whitespace-nowrap text-foreground/70">{[...actions].sort(sortScopeActions).join(' · ')}</td>
                {cols && (
                  <>
                    <td className="px-8 py-0.5">
                      <div className="w-px h-full bg-border" />
                    </td>
                    <td className="text-muted-foreground pr-6 py-0.5 whitespace-nowrap align-top">{rightEntry?.[0] ?? ''}</td>
                    <td className="py-0.5 whitespace-nowrap text-foreground/70">{rightEntry ? [...rightEntry[1]].sort(sortScopeActions).join(' · ') : ''}</td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {visible.map((scope) => (
          <Badge key={scope} variant="primary" className="font-normal shrink-0">
            {scope}
          </Badge>
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpen(true)
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0 cursor-pointer"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={useColumns ? 'max-w-4xl' : 'w-fit max-w-lg'}>
          <DialogHeader>
            <DialogTitle>Scopes ({scopes.length})</DialogTitle>
          </DialogHeader>
          {hasExcessiveScopes && (
            <Callout variant="warning" compact title="Excessive permissions">
              <span>
                This token has {elevatedScopeCount} write and delete scopes — consider reducing it to only the permissions it needs.{' '}
                <Button
                  variant="transparent"
                  size="sm"
                  className="text-amber-700 dark:text-amber-400 underline underline-offset-2 font-normal px-0"
                  onClick={() => {
                    setOpen(false)
                    setIsEditOpen(true)
                  }}
                >
                  Edit scopes
                </Button>
              </span>
            </Callout>
          )}
          <div className="pt-2 overflow-auto">{renderScopes(groupedEntries, useColumns, half)}</div>
        </DialogContent>
      </Dialog>

      <PersonalApiKeyDialog editToken={editTokenData} open={isEditOpen} onOpenChange={setIsEditOpen} />
    </>
  )
}

export const PersonalAccessTokenTable = () => {
  const path = usePathname()
  const searchParams = useSearchParams()
  const isApiTokenPage = path.includes('/api-tokens')
  const { data: permission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canManageApiToken = !isApiTokenPage || canEdit(permission?.roles, session)
  const tableKey = isApiTokenPage ? TableKeyEnum.API_TOKEN : TableKeyEnum.PERSONAL_ACCESS_TOKEN
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION, tableKey)
  const { successNotification, errorNotification } = useNotification()

  type CommonWhereType = GetPersonalAccessTokensQueryVariables['where'] | GetApiTokensQueryVariables['where']

  const [filters, setFilters] = useState<CommonWhereType | null>(null)
  const [orderBy, setOrderBy] = useOrgTableSort(tableKey, PersonalAccessTokenOrderField, [
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
    isLoading: isLoadingApiTokens,
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
    isLoading: isLoadingPersonalAccessTokens,
  } = useGetPersonalAccessTokens({
    where: whereFilter,
    orderBy: orderByFilter as GetPersonalAccessTokensQueryVariables['orderBy'],
    pagination,
    enabled: !!filters && !isApiTokenPage,
  })

  const data = isApiTokenPage ? orgTokensResponse : personalTokensResponse
  const isLoadingActive = isApiTokenPage ? isLoadingApiTokens : isLoadingPersonalAccessTokens
  const isFetchingActive = isApiTokenPage ? isFetchingApiTokens : isFetchingPersonalAccessTokens
  const isFetching = isLoadingActive || isFetchingActive
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
          expiresAt: node.expiresAt ?? null,
          lastUsedAt: node.lastUsedAt,
          scopes: node.scopes ?? [],
          ssoAuthorizations: node.ssoAuthorizations || null,
        })) || []
    : (data as GetPersonalAccessTokensQuery)?.personalAccessTokens?.edges
        ?.map((edge) => edge?.node)
        .filter((node): node is NonNullable<typeof node> => !!node && !!node.id)
        .map((node) => ({
          id: node.id,
          name: node.name ?? '',
          description: node.description ?? undefined,
          expiresAt: node.expiresAt ?? null,
          lastUsedAt: node.lastUsedAt,
          organizations: node.organizations?.edges?.map((orgEdge) => orgEdge?.node).filter((org): org is { id: string; name: string } => !!org && !!org.id && !!org.name) || [],
          ssoAuthorizations: node.ssoAuthorizations || null,
        })) || []

  const columns: ColumnDef<TokenNode>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      size: 60,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ cell }) => <TruncatedCell>{(cell.getValue() as string) || '-'}</TruncatedCell>,
    },
    isApiTokenPage
      ? {
          accessorKey: 'scopes',
          size: 180,
          header: 'Scopes',
          cell: ({ row }) => {
            const scopes = row.original.scopes ?? []
            if (!scopes.length) return '-'
            return <ScopesCellContent scopes={scopes} token={row.original} />
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
      size: 80,
      cell: ({ cell }) => {
        const value = cell.getValue() as string | null
        if (!value) {
          return (
            <span className="flex items-center gap-1.5">
              No Expiration
              <SystemTooltip
                icon={<TriangleAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                content="Tokens should have an expiration date and be rotated regularly to reduce security risk"
                side="top"
              />
            </span>
          )
        }
        const isExpired = new Date(value) < new Date()
        if (isExpired) {
          return <SystemTooltip icon={<span className="text-red-500 font-medium whitespace-nowrap cursor-default">❗ Expired</span>} content={`Expired on ${formatDate(value)}`} side="top" />
        }
        return formatDate(value)
      },
    },
    {
      accessorKey: 'lastUsedAt',
      header: 'Last used',
      size: 80,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        if (!value) return <span className="text-muted-foreground">Never used</span>
        return formatTimeSince(value)
      },
    },
    ...(canManageApiToken
      ? [
          {
            id: 'actions',
            header: '',
            size: 80,
            cell: ({ row }: { row: { original: TokenNode } }) => (
              <TokenAction
                tokenId={row.original.id}
                tokenName={row.original.name}
                tokenSsoAuthorizations={row.original.ssoAuthorizations}
                tokenDescription={row.original.description}
                tokenExpiresAt={row.original.expiresAt}
                tokenAuthorizedOrganizations={row.original.organizations}
                tokenScopes={row.original.scopes ?? []}
              />
            ),
          } satisfies ColumnDef<TokenNode>,
        ]
      : []),
  ]

  return (
    <>
      <TokensTableToolbar onFilterChange={setFilters} />
      <DataTable
        sorting={orderBy}
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
