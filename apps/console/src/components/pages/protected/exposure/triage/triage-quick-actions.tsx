'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { ArrowLeft, ArrowRight, ShieldCheck, ShieldOff, Clock } from 'lucide-react'
import { ResponsibilityPicker } from '@/components/shared/crud-base/form-fields/responsibility-picker'
import { type ResponsibilitySelection } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'

type Props = {
  assignee: ResponsibilitySelection
  onAssign: (selection: ResponsibilitySelection) => void
  onRemediate: () => void
  onAcceptRisk: () => void
  onSnooze: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  isBusy?: boolean
  canEdit: boolean
  canCreateRemediation: boolean
}

const TriageQuickActions: React.FC<Props> = ({ assignee, onAssign, onRemediate, onAcceptRisk, onSnooze, onPrev, onNext, hasPrev, hasNext, isBusy, canEdit, canCreateRemediation }) => {
  const mutationsDisabled = isBusy || !canEdit
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-secondary px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ResponsibilityPicker value={assignee} onChange={onAssign} placeholder="Assign..." triggerClassName="h-9 w-52" disabled={mutationsDisabled} />
        <Button variant="outline" size="md" icon={<ShieldCheck size={14} />} iconPosition="left" onClick={onRemediate} disabled={isBusy || !canCreateRemediation}>
          Remediate
        </Button>
        <Button variant="outline" size="md" icon={<ShieldOff size={14} />} iconPosition="left" onClick={onAcceptRisk} disabled={mutationsDisabled}>
          Accept risk
        </Button>
        <Button variant="outline" size="md" icon={<Clock size={14} />} iconPosition="left" onClick={onSnooze} disabled={mutationsDisabled}>
          Snooze
        </Button>
      </div>

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
