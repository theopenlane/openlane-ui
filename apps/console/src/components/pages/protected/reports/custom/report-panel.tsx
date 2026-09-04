'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'

type TReportPanelProps = {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}

const ReportPanel: React.FC<TReportPanelProps> = ({ title, description, action, children }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {action}
    </div>
    {description && <p className="text-xs text-muted-foreground mt-1 mb-3">{description}</p>}
    {children}
  </Card>
)

export default ReportPanel
