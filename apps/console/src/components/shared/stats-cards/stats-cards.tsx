import { Card, CardContent } from '@repo/ui/cardpanel'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Stat {
  title: string
  percentage: number
  count: number
  total: number
  trend: number
  trendType: 'up' | 'down'
  color: 'green' | 'red' | 'yellow'
}

const stats: Stat[] = [
  {
    title: 'Evidence submitted',
    percentage: 88,
    count: 178,
    total: 250,
    trend: 5.97,
    trendType: 'up',
    color: 'green',
  },
  {
    title: 'Evidence accepted',
    percentage: 8,
    count: 12,
    total: 250,
    trend: 5.97,
    trendType: 'down',
    color: 'red',
  },
  {
    title: 'Evidence overdue',
    percentage: 29,
    count: 35,
    total: 250,
    trend: 5.97,
    trendType: 'up',
    color: 'yellow',
  },
]

const colorVariants: Record<Stat['color'], { progressBg: string; progressBar: string; trendBg: string; trendText: string }> = {
  green: {
    progressBg: 'bg-green-50',
    progressBar: 'bg-green-400',
    trendBg: 'bg-green-200',
    trendText: 'text-green-700',
  },
  red: {
    progressBg: 'bg-red-50',
    progressBar: 'bg-red-700',
    trendBg: 'bg-red-200',
    trendText: 'text-red-700',
  },
  yellow: {
    progressBg: 'bg-yellow-50',
    progressBar: 'bg-yellow-500',
    trendBg: 'bg-slate-200',
    trendText: 'text-slate-700',
  },
}

const StatCard: React.FC<Stat> = ({ title, percentage, count, total, trend, trendType, color }) => {
  const colors = colorVariants[color]
  return (
    <Card className="shadow-sm border rounded-lg w-full max-w-sm">
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">
            {title} <span className="cursor-pointer">&#9432;</span>
          </h3>
          <div className={`text-xs flex items-center px-2 py-1 rounded-full ${colors.trendBg} ${colors.trendText}`}>
            {trendType === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
            {trend}%
          </div>
        </div>
        <div className="text-3xl font-semibold">{percentage}%</div>
        <div className="flex justify-between text-xs">
          <div>
            {percentage}% ({count})
          </div>
          <div>{total} Controls</div>
        </div>
        <div className={`w-full h-1.5 rounded-full ${colors.progressBg}`}>
          <div className={`h-1.5 rounded-full ${colors.progressBar}`} style={{ width: `${percentage}%` }}></div>
        </div>
      </CardContent>
    </Card>
  )
}

const StatsCards: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

export default StatsCards
