import { toHumanLabel } from '@/utils/strings'
import type { FlowSummaryProps } from '../types'

export const FlowSummary = ({ objectLabel, operationLabel, actionLabel }: FlowSummaryProps) => (
  <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">Object</p>
        <p className="font-medium">{toHumanLabel(objectLabel || '—')}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Trigger</p>
        <p className="font-medium">{operationLabel || '—'}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Action</p>
        <p className="font-medium">{actionLabel || '—'}</p>
      </div>
    </div>
  </div>
)
