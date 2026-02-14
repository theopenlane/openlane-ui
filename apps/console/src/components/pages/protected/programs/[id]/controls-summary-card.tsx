import { useGetControlCountsByStatus } from '@/lib/graphql-hooks/control'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { DonutChart } from '@repo/ui/donut-chart'
import { Settings2 } from 'lucide-react'
import Link from 'next/link'
import { saveFilters, TFilterState } from '@/components/shared/table-filter/filter-storage.ts'
import { useParams } from 'next/navigation'
import { TableKeyEnum } from '@repo/ui/table-key'

const chartColors = ['#4ADE80', '#EAB308', '#EF4444', '#107565', '#017BFE']

export function ControlsSummaryCard() {
  const { id } = useParams<{ id: string | undefined }>()

  const { data, isLoading } = useGetControlCountsByStatus(id)

  const preparingCount = data?.preparing?.totalCount ?? 0
  const changesRequestedCount = data?.changesRequested?.totalCount ?? 0
  const needsApprovalCount = data?.needsApproval?.totalCount ?? 0
  const approvedCount = data?.approved?.totalCount ?? 0
  const outstandingCount = changesRequestedCount + needsApprovalCount

  const chartData = [
    { name: 'Created', value: preparingCount },
    { name: 'Outstanding', value: outstandingCount },
    { name: 'Changes requested', value: changesRequestedCount },
    { name: 'Completed pending review', value: needsApprovalCount },
    { name: 'Completed accepted', value: approvedCount },
  ]

  const totalValue = chartData.reduce((acc, item) => acc + item.value, 0)

  const donutChartData = totalValue > 0 ? chartData : [{ name: 'No data', value: 1 }]
  const donutChartColors = totalValue > 0 ? chartColors : ['#E5E7EB']

  const handleClick = () => {
    if (!id) {
      return
    }

    const filters: TFilterState = {
      hasProgramsWith: [id],
    }

    saveFilters(TableKeyEnum.CONTROL, filters)
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center">
        <p className="text-lg">Control status</p>
        <Link href={`/controls?tab=table`} onClick={handleClick}>
          <Button variant="secondary" iconPosition="left" icon={<Settings2 size={16} />}>
            Go to controls
          </Button>
        </Link>
      </div>
      <CardContent className="flex items-center gap-8">
        <div className="w-[100px] h-[100px] shrink-0 mr-8">
          <DonutChart data={donutChartData} colors={donutChartColors} width={130} height={130} innerRadius={45} outerRadius={65} />
        </div>
        <div className="flex gap-8 flex-wrap">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex flex-col items-center gap-1">
              <div className="text-2xl font-semibold">{isLoading ? '...' : item.value}</div>
              <Badge className="text-white px-2 py-1 text-xs font-normal" style={{ backgroundColor: chartColors[i] }}>
                {item.name}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
