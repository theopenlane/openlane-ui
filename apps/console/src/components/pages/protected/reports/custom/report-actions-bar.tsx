'use client'

import React from 'react'
import { Bookmark, FolderOpen, Play, Share2, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import type { TSavedReportRef } from '@/lib/graphql-hooks/report'
import { ReportVisibilityBadge } from '../saved/report-visibility'
import ReportHistoryMenu from './report-history-menu'
import { useBusyFocusHandoff } from './use-busy-focus-handoff'
import SavedReportTitle from './saved-report-title'
import type { TReportHistoryOption } from './use-report-history'

type TReportActionsBarProps = {
  savedReport: TSavedReportRef | null
  canManage: boolean
  historyOptions: TReportHistoryOption[]
  onSelectHistory: React.ComponentProps<typeof ReportHistoryMenu>['onSelect']
  saveDisabledReason?: string
  runDisabled: boolean
  isRunning: boolean
  onClose: () => void
  onOpenSavedReports: () => void
  onShare: () => void
  onSave: () => void
  onRun: () => void
  onCancel: () => void
}

const ReportActionsBar: React.FC<TReportActionsBarProps> = ({
  savedReport,
  canManage,
  historyOptions,
  onSelectHistory,
  saveDisabledReason,
  runDisabled,
  isRunning,
  onClose,
  onOpenSavedReports,
  onShare,
  onSave,
  onRun,
  onCancel,
}) => {
  const { startRef, cancelRef } = useBusyFocusHandoff(isRunning)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {savedReport && (
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <SavedReportTitle key={savedReport.id} report={savedReport} canRename={canManage} />
          <ReportVisibilityBadge visibility={savedReport.visibility} />
          <Button
            type="button"
            variant="transparent"
            icon={<X size={14} />}
            iconPosition="left"
            className="shrink-0"
            descriptiveTooltipText="Close this saved report. Your columns and filters stay here as a new, unsaved report."
            onClick={onClose}
          >
            Close report
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {historyOptions.length > 0 && <ReportHistoryMenu options={historyOptions} onSelect={onSelectHistory} />}
        <Button type="button" variant="outline" icon={<FolderOpen size={14} />} iconPosition="left" onClick={onOpenSavedReports} {...elementAnchor('custom-report', 'saved-reports')}>
          Saved Reports
        </Button>
        {canManage && (
          <Button type="button" variant="outline" icon={<Share2 size={14} />} iconPosition="left" onClick={onShare}>
            Share
          </Button>
        )}
        <DisabledReasonTooltip reason={saveDisabledReason}>
          <Button type="button" variant="outline" icon={<Bookmark size={14} />} iconPosition="left" disabled={!!saveDisabledReason} onClick={onSave} {...elementAnchor('custom-report', 'save')}>
            Save
          </Button>
        </DisabledReasonTooltip>
        {isRunning && (
          <Button ref={cancelRef} type="button" variant="outline" icon={<X size={14} />} iconPosition="left" onClick={onCancel} {...elementAnchor('custom-report', 'cancel-run')}>
            Cancel run
          </Button>
        )}
        <Button ref={startRef} type="button" icon={<Play size={14} />} iconPosition="left" loading={isRunning} disabled={runDisabled || isRunning} onClick={onRun}>
          Run report
        </Button>
      </div>
    </div>
  )
}

export default ReportActionsBar
