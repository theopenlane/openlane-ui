'use client'
import { useMemo } from 'react'
import { useGetEvidenceCountsByStatus, type TEvidenceCountsByStatus } from '@/lib/graphql-hooks/evidence.ts'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { DonutChart } from '@repo/ui/donut-chart'
import { useSearchParams } from 'next/navigation'
import EvidenceStatusChip from '@/components/pages/protected/evidence/chart/evidence-status-chip.tsx'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { EvidenceStatusColors, getEvidenceStatusLabel } from '@/components/shared/enum-mapper/evidence-enum'

export type TChartData = {
  name: string
  value: number
  status: EvidenceEvidenceStatus
  description: string
}

const EMPTY_CHART_COLOR = '#E5E7EB'

type TChartSeries = {
  status: EvidenceEvidenceStatus
  countKey: keyof Omit<TEvidenceCountsByStatus, '__typename'>
  description: string
}

const CHART_SERIES: TChartSeries[] = [
  { status: EvidenceEvidenceStatus.REQUESTED, countKey: 'requested', description: 'Indicates that the evidence has been requested' },
  { status: EvidenceEvidenceStatus.DRAFT, countKey: 'draft', description: 'Indicates that the evidence is still a draft' },
  { status: EvidenceEvidenceStatus.SUBMITTED, countKey: 'submitted', description: 'Indicates that the evidence has been submitted' },
  { status: EvidenceEvidenceStatus.READY_FOR_AUDITOR, countKey: 'ready', description: 'Indicates that the evidence is ready for auditor review.' },
  { status: EvidenceEvidenceStatus.AUDITOR_APPROVED, countKey: 'approved', description: 'Indicates that the evidence has been approved by the auditor' },
  { status: EvidenceEvidenceStatus.NEEDS_RENEWAL, countKey: 'needsRenewal', description: 'Indicates that the evidence needs to be renewed' },
  { status: EvidenceEvidenceStatus.MISSING_ARTIFACT, countKey: 'missingArtifact', description: 'Indicates that the evidence is missing an artifact' },
  { status: EvidenceEvidenceStatus.REJECTED, countKey: 'rejected', description: 'Indicates that the evidence has been rejected by the auditor' },
]

export const EvidenceSummaryCard = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')

  const { data, isLoading } = useGetEvidenceCountsByStatus(programId)

  const chartData: TChartData[] = useMemo(
    () =>
      CHART_SERIES.map(({ status, countKey, description }) => ({
        name: getEvidenceStatusLabel(status),
        value: data?.[countKey]?.totalCount ?? 0,
        status,
        description,
      })),
    [data],
  )

  const totalValue = chartData.reduce((acc, item) => acc + item.value, 0)

  const donutChartData = totalValue > 0 ? chartData : [{ name: 'No data', value: 1 }]
  const donutChartColors = totalValue > 0 ? chartData.map((item) => EvidenceStatusColors[item.status]) : [EMPTY_CHART_COLOR]

  return (
    <Card className="p-6 mb-10">
      <div className="flex justify-between items-center">
        <p className="text-lg">Evidence Status Overview</p>
      </div>
      <CardContent className="flex items-center gap-8">
        <div className="w-[100px] h-[100px] shrink-0 mr-8">
          <DonutChart data={donutChartData} colors={donutChartColors} width={130} height={130} innerRadius={45} outerRadius={65} />
        </div>
        <div className="flex gap-8 flex-wrap">
          {chartData.map((item) => (
            <div key={item.status} className="flex flex-col items-center gap-1">
              <div className="text-2xl font-semibold">{isLoading ? '...' : item.value}</div>
              <EvidenceStatusChip data={item} programId={programId ?? ''} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
