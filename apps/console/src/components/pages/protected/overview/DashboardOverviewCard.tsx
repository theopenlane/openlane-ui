import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { type LucideIcon } from 'lucide-react'

export type TDashboardOverviewAccent = 'success' | 'info' | 'warning' | 'evidence'

const ACCENT_CLASSES: Record<TDashboardOverviewAccent, { icon: string; chip: string }> = {
  success: { icon: 'text-success', chip: 'bg-success/12' },
  info: { icon: 'text-info', chip: 'bg-info/12' },
  warning: { icon: 'text-warning', chip: 'bg-warning/12' },
  evidence: { icon: 'text-evidence-icon', chip: 'bg-evidence-icon/12' },
}

export type TDashboardOverviewStat = {
  key: string
  label: string
  subtitle: string
  value: number | null
  isLoading?: boolean
  Icon: LucideIcon
  accent: TDashboardOverviewAccent
  onClick: () => void
}

const formatStatValue = ({ value, isLoading }: Pick<TDashboardOverviewStat, 'value' | 'isLoading'>) => {
  if (isLoading) {
    return '…'
  }

  return value === null ? '—' : value.toLocaleString()
}

type DashboardOverviewCardProps = {
  title: string
  attentionCount: number
  stats: TDashboardOverviewStat[]
}

const DashboardOverviewCard: React.FC<DashboardOverviewCardProps> = ({ title, attentionCount, stats }) => (
  <Card className="bg-homepage-card border-homepage-card-border homepage-card-border">
    <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold">
      <span>{title}</span>
      <div className="flex items-center gap-2 pt-1">
        <span className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full animate-pulse ${attentionCount === 0 ? 'bg-success' : 'bg-warning'}`} />
        <span className="text-muted-foreground text-xs font-normal leading-5">{attentionCount === 0 ? 'No Items Require Attention' : `${attentionCount} Items Require Attention`}</span>
      </div>
    </CardTitle>

    <CardContent className="grid grid-cols-2 gap-3 px-6 pb-6 pt-4 lg:grid-cols-4">
      {stats.map(({ key, label, subtitle, value, isLoading, Icon, accent, onClick }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-2 rounded-lg bg-homepage-card-item-transparent p-3 border border-homepage-card-border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          onClick={onClick}
        >
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-semibold">{formatStatValue({ value, isLoading })}</span>
            <div className={`p-2 rounded-md inline-flex items-center justify-center ${ACCENT_CLASSES[accent].chip}`}>
              <Icon size={18} className={ACCENT_CLASSES[accent].icon} />
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)

export default DashboardOverviewCard
