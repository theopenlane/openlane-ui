'use client'

import React, { memo } from 'react'
import { History } from 'lucide-react'
import type { TReportQueryConfig } from '@/lib/report/report-config'
import { MAX_REPORT_HISTORY } from '@/lib/report/report-history'
import ReportPanel from './report-panel'
import type { TReportHistoryOption } from './use-report-history'

type TReportHistoryPanelProps = {
  options: TReportHistoryOption[]
  onSelect: (config: TReportQueryConfig) => void
}

const ReportHistoryPanel: React.FC<TReportHistoryPanelProps> = ({ options, onSelect }) => (
  <ReportPanel title="Recent queries" description={`Re-run any of your last ${MAX_REPORT_HISTORY} reports`}>
    <ul className="flex flex-col gap-1 max-h-64 overflow-y-auto">
      {options.map(({ id, label, runAtLabel, config }) => (
        <li key={id}>
          <button type="button" className="w-full flex items-start gap-2 rounded p-2 text-left hover:bg-muted transition-colors" onClick={() => onSelect(config)}>
            <History className="shrink-0 mt-0.5 text-muted-foreground" size={14} />
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm break-words">{label}</span>
              <span className="text-xs text-muted-foreground">Run on {runAtLabel}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  </ReportPanel>
)

export default memo(ReportHistoryPanel)
