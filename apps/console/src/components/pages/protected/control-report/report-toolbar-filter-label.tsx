import React from 'react'
import { SR_ONLY_BELOW_1300 } from '@/constants/toolbar'

type ReportToolbarFilterLabelProps = {
  label: string
  value: string
}

const ReportToolbarFilterLabel: React.FC<ReportToolbarFilterLabelProps> = ({ label, value }) => (
  <>
    <span className={`text-muted-foreground ${SR_ONLY_BELOW_1300}`}>{label}</span>
    <span className="max-w-40 truncate">{value}</span>
  </>
)

export default ReportToolbarFilterLabel
