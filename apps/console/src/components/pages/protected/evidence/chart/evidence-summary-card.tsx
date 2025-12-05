'use client'
import { useGetEvidenceCountsByStatus } from '@/lib/graphql-hooks/evidence.ts'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { DonutChart } from '@repo/ui/donut-chart'
import { useSearchParams } from 'next/navigation'
import EvidenceStatusChip from '@/components/pages/protected/evidence/chart/evidence-status-chip.tsx'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema.ts'
import { ChartColorsSequence } from '@/components/shared/enum-mapper/evidence-enum'

export type TChardData = {
  name: string
  value: number
  status: EvidenceEvidenceStatus
  description: string
}

export function EvidenceSummaryCard() {
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')

  const { data, isLoading } = useGetEvidenceCountsByStatus(programId)

  const approvedCount = data?.approved?.totalCount ?? 0
  const rejectedCount = data?.rejected?.totalCount ?? 0
  const readyCount = data?.ready?.totalCount ?? 0
  const missingArtifactCount = data?.missingArtifact?.totalCount ?? 0
  const needsRenewalCount = data?.needsRenewal?.totalCount ?? 0

  const chartData: TChardData[] = [
    { name: 'Ready', value: readyCount, status: EvidenceEvidenceStatus.READY_FOR_AUDITOR, description: 'Indicates that the evidence is ready for auditor review.' },
    { name: 'Approved', value: approvedCount, status: EvidenceEvidenceStatus.AUDITOR_APPROVED, description: 'Indicates that the evidence has been approved by the auditor' },
    { name: 'Needs Renewal', value: needsRenewalCount, status: EvidenceEvidenceStatus.NEEDS_RENEWAL, description: 'Indicates that the evidence needs to be renewed' },
    { name: 'Missing Artifact', value: missingArtifactCount, status: EvidenceEvidenceStatus.MISSING_ARTIFACT, description: 'Indicates that the evidence is missing an artifact' },
    { name: 'Rejected', value: rejectedCount, status: EvidenceEvidenceStatus.REJECTED, description: 'Indicates that the evidence has been rejected by the auditor' },
  ]

  const totalValue = chartData.reduce((acc, item) => acc + item.value, 0)

  const donutChartData = totalValue > 0 ? chartData : [{ name: 'No data', value: 1 }]
  const donutChartColors = totalValue > 0 ? ChartColorsSequence : ['#E5E7EB']

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
          {chartData.map((item, i) => (
            <div key={item.name} className="flex flex-col items-center gap-1">
              <div className="text-2xl font-semibold">{isLoading ? '...' : item.value}</div>
              <EvidenceStatusChip data={item} programId={programId!} index={i} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
