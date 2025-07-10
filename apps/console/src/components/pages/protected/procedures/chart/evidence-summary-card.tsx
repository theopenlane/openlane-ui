'use client'
import { useGetEvidenceCountsByStatus } from '@/lib/graphql-hooks/evidence.ts'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { DonutChart } from '@repo/ui/donut-chart'
import { useSearchParams } from 'next/navigation'
import { ChartColorsSequence } from '@/components/shared/icon-enum/evidence-enum.tsx'

export function EvidenceSummaryCard() {
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')

  const { data, isLoading } = useGetEvidenceCountsByStatus(programId)

  const approvedCount = data?.approved?.totalCount ?? 0
  const rejectedCount = data?.rejected?.totalCount ?? 0
  const readyCount = data?.ready?.totalCount ?? 0
  const missingArtifactCount = data?.missingArtifact?.totalCount ?? 0
  const needsRenewalCount = data?.needsRenewal?.totalCount ?? 0

  const chartData = [
    { name: 'Ready', value: readyCount },
    { name: 'Approved', value: approvedCount },
    { name: 'Needs Renewal', value: needsRenewalCount },
    { name: 'Missing Artifact', value: missingArtifactCount },
    { name: 'Rejected', value: rejectedCount },
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
              <Badge className="text-white px-2 py-1 text-xs font-normal" style={{ backgroundColor: ChartColorsSequence[i] }}>
                {item.name}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
