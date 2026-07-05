'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { ArrowLeft, ArrowRight, ShieldCheck, ShieldOff, Clock, UserPlus } from 'lucide-react'
import AssigneeSelect from './assignee-select'
import { type TriageVuln } from './triage-utils'

type Props = {
  vuln: TriageVuln
  onAssign: (userId: string | null) => void
  onRemediate: () => void
  onAcceptRisk: () => void
  onSnooze: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  isBusy?: boolean
  canEdit: boolean
}

const TriageQuickActions: React.FC<Props> = ({ vuln, onAssign, onRemediate, onAcceptRisk, onSnooze, onPrev, onNext, hasPrev, hasNext, isBusy, canEdit }) => {
  const mutationsDisabled = isBusy || !canEdit
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-secondary px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <AssigneeSelect
          value={vuln.externalOwnerID}
          onAssign={onAssign}
          disabled={mutationsDisabled}
          className="h-9 w-auto min-w-[110px]"
          trigger={
            <span className="flex items-center gap-1.5 font-medium">
              <UserPlus size={14} />
              Assign
            </span>
          }
        />
        <Button variant="outline" size="md" icon={<ShieldCheck size={14} />} iconPosition="left" onClick={onRemediate} disabled={isBusy}>
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
