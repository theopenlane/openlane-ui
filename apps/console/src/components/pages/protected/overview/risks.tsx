import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { Cog, AlertTriangle } from 'lucide-react'
import { ColumnDef } from '@tanstack/table-core'
import { useRisksWithFilter } from '@/lib/graphql-hooks/risks'
import { useSearchParams } from 'next/navigation'
import { Group, RiskRiskStatus, RiskWhereInput } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'

type Stakeholder = {
  id: string
  displayName: string
  avatarUrl?: string
}

type FormattedRisk = {
  id: string
  name: string
  for: string[]
  score: number | null
  stakeholder?: Stakeholder | null
}

const columns: ColumnDef<FormattedRisk>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => {
      const id = row.original.id
      const name: string = row.getValue('name')

      return (
        <Link href={`/risks/${id}`} className="text-blue-600 hover:underline">
          {name}
        </Link>
      )
    },
  },
  {
    header: 'For',
    accessorKey: 'for',
    cell: ({ row }) => row.original.for?.join(', ') || '—',
  },
  {
    header: 'Stakeholder',
    accessorKey: 'stakeholder',
    cell: ({ row }) => {
      const stakeholder = row.getValue('stakeholder') as Stakeholder | null

      return (
        <div className="flex items-center gap-2">
          {stakeholder && <Avatar entity={stakeholder as Group} />}
          {stakeholder?.displayName || '—'}
        </div>
      )
    },
  },
  {
    header: 'Score',
    accessorKey: 'score',
  },
]

const Risks = () => {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const [pagination, setPagination] = useState<TPagination>({ ...DEFAULT_PAGINATION, pageSize: 5 })

  const { groups } = useGetAllGroups({ where: {} })
  const [tab, setTab] = useState<'created' | 'assigned'>('created')

  const stakeholderGroupIds = useMemo(() => groups?.map((group) => group.id) ?? [], [groups])

  const where: RiskWhereInput = useMemo(() => {
    if (tab === 'assigned') {
      return {
        stakeholderIDIn: stakeholderGroupIds,
        statusNEQ: RiskRiskStatus.MITIGATED,
        hasProgramsWith: programId ? [{ id: programId }] : undefined,
      }
    }

    return {
      createdBy: session?.user?.userId,
      statusNEQ: RiskRiskStatus.MITIGATED,
      hasProgramsWith: programId ? [{ id: programId }] : undefined,
    }
  }, [tab, session?.user?.userId, stakeholderGroupIds, programId])

  const { risks, paginationMeta } = useRisksWithFilter({ where })

  const formattedRisks: FormattedRisk[] =
    risks?.map((risk) => {
      const controls = risk.controls?.edges?.flatMap((edge) => (edge?.node?.refCode ? [edge.node.refCode] : [])) ?? []
      const subcontrols = risk.subcontrols?.edges?.flatMap((edge) => (edge?.node?.refCode ? [edge.node.refCode] : [])) ?? []

      return {
        id: risk.id,
        name: risk.name,
        for: [...controls, ...subcontrols],
        score: risk.score ?? null,
        stakeholder: risk?.stakeholder,
      }
    }) || []

  const filters = [
    {
      field: 'hasProgramsWith',
      value: programId,
      type: 'selectIs',
      operator: 'EQ',
    },
  ]

  const encodedFilters = encodeURIComponent(JSON.stringify(filters))
  const risksRedirectURL = programId ? `/risks?regularFilters=${encodedFilters}` : '/risks'

  const hasData = formattedRisks.length > 0

  return (
    <Card className="shadow-md rounded-lg flex-1">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-6 pt-6">
          <CardTitle className="text-lg font-semibold">Risks</CardTitle>
          <Button variant="outline" className="flex items-center gap-2" icon={<Cog size={16} />} iconPosition="left">
            Edit
          </Button>
        </div>

        <Tabs
          variant="underline"
          value={tab}
          onValueChange={(v) => {
            setTab(v as 'created' | 'assigned')
            setPagination(DEFAULT_PAGINATION)
          }}
          className="px-6"
        >
          <TabsList>
            <TabsTrigger value="created">Risks I&apos;ve Created</TabsTrigger>
            <TabsTrigger value="assigned">Risks Assigned to Me</TabsTrigger>
          </TabsList>
        </Tabs>

        <CardContent>
          {hasData ? (
            <DataTable columns={columns} data={formattedRisks} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <AlertTriangle size={89} strokeWidth={1} className="text-border mb-4" />
              <h2 className="text-lg font-semibold">You have no risks</h2>
              <Link href={risksRedirectURL} className="mt-4">
                <Button variant="outline">Take me there</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

export default Risks
