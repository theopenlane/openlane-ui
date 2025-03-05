'use client'

import { GetApiTokensQuery, GetPersonalAccessTokensQuery } from '@repo/codegen/src/schema'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { TokenAction } from './actions/pat-actions'
import { KeyRound } from 'lucide-react'
import { personalAccessTokenTableStyles } from './personal-access-tokens-table-styles'
import PersonalApiKeyDialog from './personal-access-token-create-dialog'
import { usePathname } from 'next/navigation'
import { TableCell, TableRow } from '@repo/ui/table'
import { useGetApiTokens, useGetPersonalAccessTokens } from '@/lib/graphql-hooks/tokens'

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

  const { data, isFetching, isError } = isOrg ? useGetApiTokens() : useGetPersonalAccessTokens()

  if (isError || !data) return null

  const tokens: TokenNode[] = isOrg
    ? (data as GetApiTokensQuery).apiTokens?.edges
        ?.filter((edge): edge is NonNullable<typeof edge> => !!edge?.node && !!edge.node.id)
        .map((edge) => ({
          id: edge.node!.id,
          name: edge.node!.name || 'Unnamed Token',
          description: edge.node!.description || '',
          expiresAt: edge.node!.expiresAt || '',
          scopes: edge.node!.scopes?.join(', ') || '-',
        })) || []
    : (data as GetPersonalAccessTokensQuery).personalAccessTokens?.edges
        ?.filter((edge): edge is NonNullable<typeof edge> => !!edge?.node && !!edge.node.id)
        .map((edge) => ({
          id: edge.node!.id,
          name: edge.node!.name || 'Unnamed Token',
          description: edge.node!.description || '',
          expiresAt: edge.node!.expiresAt || '',
          organizations: edge.node!.organizations || [],
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
        return value ? format(new Date(value), 'd MMM yyyy') : 'Never'
      },
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => <TokenAction tokenId={cell.getValue() as string} />,
    },
  ]

  return (
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
  )
}
