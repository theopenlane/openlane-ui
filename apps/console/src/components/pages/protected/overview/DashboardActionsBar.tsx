import React from 'react'

export type TDashboardAction = {
  key: string
  label: string
  icon: React.ReactNode
  onClick: () => void
}

const actionClassName = 'flex items-center gap-1.5 text-text-paragraph hover:text-muted-foreground transition-colors'

const DashboardActionsBar: React.FC<{ actions: TDashboardAction[] }> = ({ actions }) => (
  <div className="flex flex-wrap items-center gap-3 text-sm">
    <span className="text-muted-foreground">Quick actions</span>
    {actions.map((action) => (
      <React.Fragment key={action.key}>
        <span className="text-border">|</span>
        <button type="button" onClick={action.onClick} className={actionClassName}>
          {action.icon}
          {action.label}
        </button>
      </React.Fragment>
    ))}
  </div>
)

export default DashboardActionsBar
