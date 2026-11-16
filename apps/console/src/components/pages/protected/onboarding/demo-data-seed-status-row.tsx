import { CircleAlert, CircleCheck, Database, Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { type TDemoDataSeedStatus } from '@/components/pages/protected/onboarding/hooks/use-demo-data-seed-status'

const STATUS_COPY: Record<TDemoDataSeedStatus, { icon: LucideIcon; iconClassName: string; title: string; description: string }> = {
  pending: { icon: Loader2, iconClassName: 'animate-spin text-primary', title: 'Creating demo data...', description: 'You can wait here or continue to your dashboard.' },
  completed: { icon: CircleCheck, iconClassName: 'text-success', title: 'Demo data added', description: 'Sample records are ready to explore in your organization.' },
  failed: {
    icon: CircleAlert,
    iconClassName: 'text-destructive',
    title: "We couldn't add all of the demo data",
    description: 'You can remove it and add it again from Organization Settings → General Settings.',
  },
  'timed-out': {
    icon: Database,
    iconClassName: 'text-primary',
    title: 'This is taking longer than expected',
    description: 'Check Organization Settings → General Settings later to see whether demo data was added.',
  },
}

const DemoDataSeedStatusRow = ({ status }: { status: TDemoDataSeedStatus }) => {
  const { icon: Icon, iconClassName, title, description } = STATUS_COPY[status]

  return (
    <div role="status" aria-live="polite" className="mb-6 flex items-start gap-3">
      <Icon size={20} className={cn('mt-0.5 shrink-0', iconClassName)} />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    </div>
  )
}

export default DemoDataSeedStatusRow
