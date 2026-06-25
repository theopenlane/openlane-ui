'use client'

import React from 'react'
import { Callout } from '@/components/shared/callout/callout'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import { ControlsEmptyActions } from './control-empty'

const ReportEmptyState: React.FC = () => (
  <div className="max-w-6xl mx-auto">
    <p className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">
      No controls found. <span className="text-foreground font-medium">Create one now</span> using any option below.
    </p>

    <div className="mt-6 grid grid-cols-3">
      <div className="col-span-2 grid">
        <ControlsEmptyActions />
      </div>

      <div className="row-span-2 ml-4">
        <Callout variant="info" title="What are Controls?" className="h-full self-stretch ">
          <br />
          Controls are the foundation of your compliance program in Openlane. Each control defines a specific security, privacy, or operational requirement that your organization follows to protect
          systems and data. <br />
          <br />
          Controls serve as the bridge between high-level compliance frameworks (like SOC 2 or ISO 27001) and the actual policies, procedures, and evidence your team manages day-to-day. By
          implementing and maintaining controls, you demonstrate how your organization meets key standards and reduces risk across your environment.
          <br />
          <br />
          <a href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/controls/overview`} target="_blank" rel="noopener noreferrer" className="ml-1 text-(--color-info) underline underline-offset-4 hover:opacity-80">
            See docs to learn more.
          </a>
        </Callout>
      </div>
    </div>
  </div>
)

export default ReportEmptyState
