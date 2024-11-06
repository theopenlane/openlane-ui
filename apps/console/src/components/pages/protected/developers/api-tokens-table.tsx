'use client'

import { useGetApiTokensQuery } from '@repo/codegen/src/schema'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { TokenAction } from './actions/token-actions'

type TokenNode = {
  __typename?: 'APIToken' | undefined
  id: string
  name: string
  description?: string
  expiresAt: string
  scopes: string[]
}

type TokenEdge = {
  __typename?: 'APITokenEdge' | undefined
  node?: TokenNode | null
}

export const APITokenTable = () => {
  const { data: session } = useSession()

  const [{ data, fetching, error }, refetch] = useGetApiTokensQuery({
    pause: !session,
  })

  if (fetching) return <p>Loading...</p>
  if (error || !data) return null

  const tokens: TokenNode[] =
    data.apiTokens.edges
      ?.filter((edge): edge is TokenEdge => edge !== null && edge.node !== null)
      .map((edge) => edge.node as TokenNode) || []

  const columns: ColumnDef<TokenNode>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'scopes',
      header: 'Scopes',
      cell: ({ cell }) => {
        const value = cell.getValue() as string[]
        return value ? value.join(', ') : ''
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
      cell: ({ cell }) => (
        <TokenAction
          tokenId={cell.getValue() as string}
          refetchTokens={refetch}
        />
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={tokens}
      noResultsText="No tokens found"
    />
  )
}

