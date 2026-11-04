'use client'

import React from 'react'
import { Bookmark, FolderOpen, Play, Share2, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import type { TSavedReportRef } from '@/lib/graphql-hooks/report'
import { ReportVisibilityBadge } from '../saved/report-visibility'
import ReportHistoryMenu from './report-history-menu'
import type { TReportHistoryOption } from './use-report-history'

type TReportActionsBarProps = {
  savedReport: TSavedReportRef | null
  canShare: boolean
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
}

const ReportActionsBar: React.FC<TReportActionsBarProps> = ({
  savedReport,
  canShare,
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
}) => (
  <div className="flex items-center gap-2 flex-wrap">
    {savedReport && (
      <div className="flex min-w-0 max-w-full items-center gap-2">
        <span className="truncate text-sm font-medium">{savedReport.name}</span>
        <ReportVisibilityBadge visibility={savedReport.visibility} />
        <Button type="button" variant="icon" size="icon-sm" descriptiveTooltipText="Close saved report" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
    )}

    <div className="flex items-center gap-2 flex-wrap ml-auto">
      {historyOptions.length > 0 && <ReportHistoryMenu options={historyOptions} onSelect={onSelectHistory} />}
      <Button type="button" variant="outline" icon={<FolderOpen size={14} />} iconPosition="left" onClick={onOpenSavedReports} {...elementAnchor('custom-report', 'saved-reports')}>
        Saved Reports
      </Button>
      {canShare && (
        <Button type="button" variant="outline" icon={<Share2 size={14} />} iconPosition="left" onClick={onShare}>
          Share
        </Button>
      )}
      <DisabledReasonTooltip reason={saveDisabledReason}>
        <Button type="button" variant="outline" icon={<Bookmark size={14} />} iconPosition="left" disabled={!!saveDisabledReason} onClick={onSave} {...elementAnchor('custom-report', 'save')}>
          Save
        </Button>
      </DisabledReasonTooltip>
      <Button type="button" icon={<Play size={14} />} iconPosition="left" loading={isRunning} disabled={runDisabled} onClick={onRun}>
        Run report
      </Button>
    </div>
  </div>
)

export default ReportActionsBar
