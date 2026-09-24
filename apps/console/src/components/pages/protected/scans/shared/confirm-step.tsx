'use client'

import React from 'react'
import { ConfirmGroup } from './confirm-group'
import type { ScanSummarySection } from './types'

type ConfirmStepProps<TStepId extends string> = {
  sections: ScanSummarySection<TStepId>[]
  onEditStep: (stepId: TStepId) => void
}

export const ConfirmStep = <TStepId extends string>({ sections, onEditStep }: ConfirmStepProps<TStepId>) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Review everything below before importing it into Openlane. Each section is collapsed by default, expand to see individual entries.</p>
    {sections.map((section) => (
      <ConfirmGroup key={section.stepId} title={section.title} items={section.items} onEdit={() => onEditStep(section.stepId)} />
    ))}
  </div>
)
