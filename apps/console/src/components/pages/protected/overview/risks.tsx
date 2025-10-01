import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { AlertTriangle } from 'lucide-react'
import { VisibilityState } from '@tanstack/table-core'
import { useRisksWithFilter } from '@/lib/graphql-hooks/risks'
import { useSearchParams } from 'next/navigation'
import { RiskRiskStatus, RiskWhereInput } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { FormattedRisk, getRiskColumns } from './risks-table-config'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'
import { saveFilters, TFilterState } from '@/components/shared/table-filter/filter-storage.ts'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys.ts'

const Risks = () => {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const [pagination, setPagination] = useState<TPagination>({ ...DEFAULT_PAGINATION, pageSize: 5 })

  const { groups } = useGetAllGroups({ where: {} })
  const [tab, setTab] = useState<'created' | 'assigned'>('created')

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdBy: false,
    createdAt: false,
    updatedBy: false,
    updatedAt: false,
  })

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
        createdBy: risk.createdBy ?? undefined,
        updatedBy: risk.updatedBy ?? undefined,
        createdAt: risk.createdAt ?? undefined,
        updatedAt: risk.updatedAt ?? undefined,
      }
    }) || []

  const hasData = formattedRisks.length > 0

  const userIds = useMemo(() => {
    if (!risks) return []
    const ids = new Set<string>()
    risks.forEach((risk) => {
      if (risk.createdBy) ids.add(risk.createdBy)
      if (risk.updatedBy) ids.add(risk.updatedBy)
    })
    return Array.from(ids)
  }, [risks])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const handleClick = () => {
    if (!programId) {
      return
    }

    const filters: TFilterState = {
      hasProgramsWith: [programId],
    }

    saveFilters(TableFilterKeysEnum.RISK, filters)
  }

  const { columns, mappedColumns } = useMemo(() => getRiskColumns({ userMap }), [userMap])

  return (
    <TooltipProvider>
      <Card className="shadow-md rounded-lg flex-1">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-6">
            <CardTitle className="text-lg font-semibold">Risks</CardTitle>
            {/* <Button variant="outline" className="flex items-center gap-2" icon={<Cog size={16} />} iconPosition="left">
              Edit
            </Button> */}

            {mappedColumns && columnVisibility && setColumnVisibility && (
              <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility}></ColumnVisibilityMenu>
            )}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="created" className="cursor-help bg-unset">
                    Risks I&apos;ve Created
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Risks that you have created and monitoring</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="assigned" className="cursor-help bg-unset">
                    Risks Assigned to Me
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>Risks where you are the stakeholder or delegate responsible for oversight and review</TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>

          <CardContent>
            {hasData ? (
              <DataTable
                columns={columns}
                data={formattedRisks}
                pagination={pagination}
                onPaginationChange={setPagination}
                paginationMeta={paginationMeta}
                loading={fetchingUsers}
                columnVisibility={columnVisibility}
                setColumnVisibility={setColumnVisibility}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <AlertTriangle height={45} width={45} strokeWidth={1} className="text-border mb-4" />
                <h2 className="text-lg font-semibold">You have no risks</h2>
                <Link href="/risks" className="mt-4" onClick={handleClick}>
                  <Button variant="outline">Take me there</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </TooltipProvider>
  )
}

export default Risks
