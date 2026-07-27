import React from 'react'
import { Button } from '@repo/ui/button'
import { HIDE_BELOW_1400, ICON_ONLY_BELOW_1400 } from '@/constants/toolbar'

type ReportToolbarActionProps = {
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick: () => void
}

const ReportToolbarAction: React.FC<ReportToolbarActionProps> = ({ label, icon, active = false, onClick }) => (
  <Button type="button" variant="outline" className={`h-7.5 gap-1.5 px-3 ${ICON_ONLY_BELOW_1400} ${active ? 'border border-primary' : ''}`} onClick={onClick} descriptiveTooltipText={label}>
    {icon}
    <span className={HIDE_BELOW_1400}>{label}</span>
  </Button>
)

export default ReportToolbarAction
