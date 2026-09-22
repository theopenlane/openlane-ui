import { SystemTooltip } from '@repo/ui/system-tooltip'

interface DisabledReasonTooltipProps {
  reason?: string | null
  side?: 'bottom' | 'top' | 'right' | 'left'
  children: React.ReactNode
}

export const DisabledReasonTooltip = ({ reason, side, children }: DisabledReasonTooltipProps) =>
  reason ? <SystemTooltip content={reason} side={side} portal icon={<span className="inline-flex">{children}</span>} /> : <>{children}</>
