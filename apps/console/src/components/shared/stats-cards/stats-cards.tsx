import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Hourglass } from 'lucide-react'
import { statCardStyles } from './stats-cards-styles'
import { useParams, useSearchParams } from 'next/navigation'
import { useProgramEvidenceStats, type EvidenceStatStatus } from '@/lib/graphql-hooks/program'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'
import Link from 'next/link'
import { saveFilters, type TFilterStateFor } from '@/components/shared/table-filter/filter-storage.ts'
import { type TEvidenceFilterKey } from '@/components/pages/protected/evidence/table/table-config.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { EvidenceStatusColors } from '@/components/shared/enum-mapper/evidence-enum'
import { useOrganization } from '@/hooks/useOrganization'

type StatDefinition = {
  title: string
  status: EvidenceStatStatus
  tooltip: string
}

const EVIDENCE_STAT_CARDS: StatDefinition[] = [
  {
    title: 'Evidence Requested',
    status: EvidenceEvidenceStatus.REQUESTED,
    tooltip: 'Evidence requested is the percentage of controls with evidence that has been requested but not yet provided.',
  },
  {
    title: 'Evidence Submitted',
    status: EvidenceEvidenceStatus.SUBMITTED,
    tooltip: 'Evidence submitted is the percentage of controls with evidence that has been submitted but not reviewed internally or by an auditor.',
  },
  {
    title: 'Evidence Accepted',
    status: EvidenceEvidenceStatus.AUDITOR_APPROVED,
    tooltip: 'Evidence accepted is the percentage of controls with evidence that has been accepted by the auditor.',
  },
]

const { wrapper, content, title: titleClass, percentage: percentageClass, statDetails, progressWrapper, progressBar } = statCardStyles()

type StatCardProps = {
  stat: StatDefinition
  count: number
  total: number
  programId: string | undefined
}

const StatCard: React.FC<StatCardProps> = ({ stat, count, total, programId }) => {
  const { currentOrgId } = useOrganization()
  const { title, status, tooltip } = stat
  const percentage = total ? Math.round((count / total) * 100) : 0

  const handleClick = () => {
    const filters: TFilterStateFor<TEvidenceFilterKey> = {
      statusIn: [status],
    }

    saveFilters(TableKeyEnum.EVIDENCE, filters, currentOrgId)
  }

  return (
    <Link className="w-full" href={programId ? `/evidence?programId=${encodeURIComponent(programId)}` : '/evidence'} onClick={handleClick}>
      <Card className={wrapper()}>
        <CardContent className={content()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className={titleClass({ class: 'cursor-help' })}>{title}</h3>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
          {total === 0 ? (
            <div className="flex items-center gap-2 justify-start mt-5 ">
              <Hourglass size={24} strokeWidth={1} className="text-brand" />
              <span>No data...</span>
            </div>
          ) : (
            <>
              <div className={percentageClass()}>{percentage}%</div>
              <div className={statDetails()}>
                <p className="text-base">{`${percentage}% (${count})`}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-base cursor-help">{`${total} Controls`}</p>
                  </TooltipTrigger>
                  <TooltipContent>
                    Total number of controls included in the audit program. In the case of all programs, this is the total number of controls across all programs within the organization.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className={progressWrapper()}>
                <div
                  className={progressBar()}
                  style={{
                    width: percentage > 0 ? `${percentage}%` : '1px',
                    minWidth: '1px',
                    backgroundColor: EvidenceStatusColors[status],
                  }}
                ></div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

const StatsCards: React.FC = () => {
  const params = useParams<{ id?: string }>()
  const searchParams = useSearchParams()

  const queryId = searchParams.get('id') ?? undefined
  const routeId = params?.id

  const id = queryId || routeId

  const { data } = useProgramEvidenceStats(id)

  const total = data?.total ?? 0

  return (
    <TooltipProvider>
      <div className="flex gap-8 justify-center">
        {EVIDENCE_STAT_CARDS.map((stat) => (
          <StatCard key={stat.status} stat={stat} count={data?.byStatus[stat.status] ?? 0} total={total} programId={id} />
        ))}
      </div>
    </TooltipProvider>
  )
}

export default StatsCards
