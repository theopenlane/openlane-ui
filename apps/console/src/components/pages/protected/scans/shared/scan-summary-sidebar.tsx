'use client'

import React from 'react'
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { SidebarGroupRow } from './sidebar-group-row'
import type { ScanSummarySection } from './types'

type ScanSummarySidebarProps<TStepId extends string> = {
  sections: ScanSummarySection<TStepId>[]
  onEditStep: (stepId: TStepId) => void
}

export const ScanSummarySidebar = <TStepId extends string>({ sections, onEditStep }: ScanSummarySidebarProps<TStepId>) => (
  <Card>
    <CardTitle className="text-xl py-3">What you&apos;re adding</CardTitle>
    <CardDescription className="pb-3">A live summary of what will be created. Expand a section to see the individual entries, or edit to jump back.</CardDescription>
    {sections.map((section) => (
      <React.Fragment key={section.stepId}>
        <Separator separatorClass="bg-border" />
        <SidebarGroupRow title={section.title} items={section.items} onEdit={() => onEditStep(section.stepId)} />
      </React.Fragment>
    ))}
  </Card>
)
