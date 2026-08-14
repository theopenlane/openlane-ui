'use client'

import React from 'react'
import { ControlsEmptyActions } from './control-empty'

const ReportEmptyState: React.FC = () => (
  <div className="max-w-6xl mx-auto">
    <p className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">
      No controls found. <span className="text-foreground font-medium">Create one now</span> using any option below.
    </p>

    <div className="mt-6 grid">
      <ControlsEmptyActions />
    </div>
  </div>
)

export default ReportEmptyState
