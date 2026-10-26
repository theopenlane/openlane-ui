import { useId, type ComponentProps, type ReactNode } from 'react'
import { Switch } from '@repo/ui/switch'
import { cn } from '@repo/ui/lib/utils'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'

type NdaSwitchRowProps = Pick<ComponentProps<typeof Switch>, 'checked' | 'onCheckedChange' | 'disabled'> & {
  label: ReactNode
  description: ReactNode
  disabledReason?: string | null
  className?: string
}

export const NdaSwitchRow = ({ label, description, disabledReason = null, className, ...switchProps }: NdaSwitchRowProps) => {
  const labelId = useId()
  const descriptionId = useId()

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-medium leading-none">
          {label}
        </p>
        <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <DisabledReasonTooltip reason={disabledReason}>
        <Switch aria-labelledby={labelId} aria-describedby={descriptionId} className="mt-1 shrink-0" {...switchProps} />
      </DisabledReasonTooltip>
    </div>
  )
}
