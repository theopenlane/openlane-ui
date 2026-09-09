import React from 'react'
import { Card, CardContent } from '@theopenlane/ui/cardpanel'
import { Hourglass } from 'lucide-react'
import { statCardStyles, type StatCardVariants } from './stats-cards-styles'
import { useParams, useSearchParams } from 'next/navigation'
import { useProgramEvidenceStats } from '@/lib/graphql-hooks/program'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@theopenlane/ui/tooltip'
import Link from 'next/link'
import { saveFilters, type TFilterStateFor } from '@/components/shared/table-filter/filter-storage.ts'
import { type TEvidenceFilterKey } from '@/components/pages/protected/evidence/table/table-config.ts'
import { TableKeyEnum } from '@theopenlane/ui/table-key'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { useOrganization } from '@/hooks/useOrganization'

interface Stat {
  title: string
  status: EvidenceEvidenceStatus
  percentage: number
  count: number
  total: number
  color: NonNullable<StatCardVariants['color']>
  tooltip: React.ReactNode
}

const StatCard: React.FC<{ stat: Stat; programId: string | undefined }> = ({ stat, programId }) => {
  const { currentOrgId } = useOrganization()
  const { title, percentage, count, total, color, tooltip } = stat
  const { wrapper, content, title: titleClass, percentage: percentageClass, statDetails, progressWrapper, progressBar } = statCardStyles({ color })

  const handleClick = () => {
    const filters: TFilterStateFor<TEvidenceFilterKey> = {
      statusIn: [stat.status],
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

  const dynamicStats: Stat[] = [
    {
      title: 'Evidence Submitted',
      status: EvidenceEvidenceStatus.READY_FOR_AUDITOR,
      percentage: total ? Math.round(((data?.submitted ?? 0) / total) * 100) : 0,
      count: data?.submitted ?? 0,
      total,
      color: 'blue',
      tooltip: 'Evidence submitted is the percentage of evidence that has been submitted but not reviewed internally or by an auditor.',
    },
    {
      title: 'Evidence Accepted',
      status: EvidenceEvidenceStatus.AUDITOR_APPROVED,
      percentage: total ? Math.round(((data?.accepted ?? 0) / total) * 100) : 0,
      count: data?.accepted ?? 0,
      total,
      color: 'green',
      tooltip: 'Evidence accepted is the percentage of evidence that has been accepted by the auditor.',
    },
    {
      title: 'Evidence Rejected',
      status: EvidenceEvidenceStatus.REJECTED,
      percentage: total ? Math.round(((data?.rejected ?? 0) / total) * 100) : 0,
      count: data?.rejected ?? 0,
      total,
      color: 'red',
      tooltip: 'Evidence rejected is the percentage of evidence that has been rejected by the auditor and needs to be resubmitted.',
    },
  ]

  return (
    <TooltipProvider>
      <div className="flex gap-8 justify-center">
        {dynamicStats.map((stat) => (
          <StatCard programId={id} key={stat.title} stat={stat} />
        ))}
      </div>
    </TooltipProvider>
  )
}

export default StatsCards
