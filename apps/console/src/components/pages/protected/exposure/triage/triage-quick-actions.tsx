'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { ArrowLeft, ArrowRight, ShieldCheck, ShieldOff, Clock } from 'lucide-react'
import { ResponsibilityPicker } from '@/components/shared/crud-base/form-fields/responsibility-picker'
import { type ResponsibilitySelection } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

export type TTriageRecordActions = {
  assignee: ResponsibilitySelection
  onAssign: (selection: ResponsibilitySelection) => void
  onRemediate: () => void
  onAcceptRisk: () => void
  onSnooze: () => void
  canEdit: boolean
  canCreateRemediation: boolean
}

type Props = {
  actions?: TTriageRecordActions
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  isBusy?: boolean
}

const TriageQuickActions: React.FC<Props> = ({ actions, onPrev, onNext, hasPrev, hasNext, isBusy }) => {
  const mutationsDisabled = isBusy || !actions?.canEdit
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-secondary px-6 py-3">
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">
          <ResponsibilityPicker value={actions.assignee} onChange={actions.onAssign} placeholder="Assign..." triggerClassName="h-9 w-52" disabled={mutationsDisabled} />
          <Button variant="outline" size="md" icon={<ShieldCheck size={14} />} iconPosition="left" onClick={actions.onRemediate} disabled={isBusy || !actions.canCreateRemediation}>
            Remediate
          </Button>
          <Button variant="outline" size="md" icon={<ShieldOff size={14} />} iconPosition="left" onClick={actions.onAcceptRisk} disabled={mutationsDisabled}>
            Accept risk
          </Button>
          <Button variant="outline" size="md" icon={<Clock size={14} />} iconPosition="left" onClick={actions.onSnooze} disabled={mutationsDisabled}>
            Snooze
          </Button>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Select reports below to act on them together.</span>
      )}

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="md" icon={<ArrowLeft size={14} />} iconPosition="left" onClick={onPrev} disabled={!hasPrev || isBusy}>
          Prev
        </Button>
        <Button variant="secondary" size="md" onClick={onNext} disabled={!hasNext || isBusy}>
          <span className="flex items-center gap-1.5">
            Next
            <ArrowRight size={14} />
          </span>
        </Button>
      </div>
    </div>
  )
}

export default TriageQuickActions
