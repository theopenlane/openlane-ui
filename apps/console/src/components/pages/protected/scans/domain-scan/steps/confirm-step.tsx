'use client'

import React from 'react'
import { ConfirmGroup } from '../components/confirm-group'
import type { DomainScanSummarySection, EditableStepId } from '../types'

type ConfirmStepProps = {
  sections: DomainScanSummarySection[]
  onEditStep: (stepId: EditableStepId) => void
}

export const ConfirmStep = ({ sections, onEditStep }: ConfirmStepProps) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Review everything below before importing it into Openlane. Each section is collapsed by default, expand to see individual entries.</p>
    {sections.map((section) => (
      <ConfirmGroup key={section.stepId} title={section.title} items={section.items} onEdit={() => onEditStep(section.stepId)} />
    ))}
  </div>
)
