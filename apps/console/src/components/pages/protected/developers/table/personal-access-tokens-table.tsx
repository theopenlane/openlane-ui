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
import { format } from 'date-fns'
import { KeyRound } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { TableCell, TableRow } from '@repo/ui/table'
import { useGetApiTokens, useGetPersonalAccessTokens } from '@/lib/graphql-hooks/tokens'
import PersonalAccessTokensTableToolbar from '@/components/pages/protected/developers/table/personal-access-tokens-table-toolbar.tsx'
import { useMemo, useState } from 'react'
import { personalAccessTokenTableStyles } from '../personal-access-tokens-table-styles'
import { TokenAction } from '@/components/pages/protected/developers/actions/pat-actions.tsx'
import PersonalApiKeyDialog from '../personal-access-token-create-dialog'

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

  const { tableRow, keyIcon, message } = personalAccessTokenTableStyles()

  type CommonWhereType = GetPersonalAccessTokensQueryVariables['where'] | GetApiTokensQueryVariables['where']

  type CommonOrderByType = Array<{
    field: PersonalAccessTokenOrderField | any
    direction: OrderDirection
  }>

  const [filters, setFilters] = useState<CommonWhereType>({})
  const [orderBy, setOrderBy] = useState<CommonOrderByType>([
    {
      field: PersonalAccessTokenOrderField.expires_at,
      direction: OrderDirection.ASC,
    },
  ])

  const whereFilter = useMemo(() => {
    return { ...filters } as CommonWhereType
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy.length > 0 ? orderBy : undefined
  }, [orderBy])

  //@todo add these when orders will be implemented
  //orderByFilter as GetApiTokensQueryVariables['orderBy']
  //orderByFilter as GetPersonalAccessTokensQueryVariables['orderBy']

  const { data, isError } = isOrg ? useGetApiTokens(whereFilter) : useGetPersonalAccessTokens(whereFilter)

  if (isError || !data) return null

  const tokens: TokenNode[] = isOrg
    ? (data as GetApiTokensQuery).apiTokens?.edges?.map((edge) => ({
        id: edge?.node?.id!!,
        name: edge?.node?.name || 'Unnamed Token',
        description: edge?.node?.description!!,
        expiresAt: edge?.node?.expiresAt!!,
        scopes: edge?.node?.scopes?.join(', ') || '-',
      })) || []
    : (data as GetPersonalAccessTokensQuery).personalAccessTokens?.edges?.map((edge) => ({
        id: edge?.node?.id!!,
        name: edge?.node?.name!!,
        description: edge?.node?.description!!,
        expiresAt: edge?.node?.expiresAt!!,
        organizations:
          edge?.node?.organizations?.edges?.map((orgEdge) => ({
            id: orgEdge?.node?.id!!,
            name: orgEdge?.node?.name!!,
          })) || [],
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
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => <TokenAction tokenId={cell.getValue() as string} />,
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires',
      cell: ({ cell }) => {
        const value = cell.getValue() as string | null
        return value ? format(new Date(value), 'd MMM yyyy') : 'Never'
      },
    },
  ]

  return (
    <>
      <PersonalAccessTokensTableToolbar onFilterChange={setFilters} onSortChange={setOrderBy} />
      <DataTable
        columns={columns}
        data={tokens}
        noResultsText="No tokens found"
        noDataMarkup={
          <TableRow className={tableRow()}>
            <TableCell colSpan={columns.length}>
              <div className="flex flex-col justify-center items-center">
                <KeyRound height={89} width={89} className={keyIcon()} strokeWidth={1} color="#DAE3E7" />
                <p className={message()}> No tokens found</p>
                <PersonalApiKeyDialog triggerText />
              </div>
            </TableCell>
          </TableRow>
        }
      />
    </>
  )
}
