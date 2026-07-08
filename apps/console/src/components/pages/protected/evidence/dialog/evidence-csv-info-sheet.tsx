'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { EVIDENCE_DOCS_URL } from '@/constants/docs'

type TEvidenceCSVField = {
  name: string
  required?: boolean
  description: string
}

const EVIDENCE_CSV_FIELDS: TEvidenceCSVField[] = [
  {
    name: 'Name',
    required: true,
    description: 'A short title for the evidence being requested, e.g. "Logging Alerts Configuration".',
  },
  {
    name: 'Description',
    description: 'Instructions describing what should be provided, e.g. "Provide a screenshot of the logging alerts configured in GCP".',
  },
  {
    name: 'Status',
    description: 'The initial status of the evidence. Use REQUESTED to request evidence from the responsible party.',
  },
  {
    name: 'ControlRefCodes',
    description: 'The reference code(s) of the control(s) to associate the evidence with, e.g. "CC2.1".',
  },
]

const EVIDENCE_CSV_EXAMPLE = `Name,Description,Status,ControlRefCodes
Logging Alerts Configuration,Provide a screenshot of the logging alerts configured in GCP,REQUESTED,CC2.1`

type TEvidenceCSVInfoSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EvidenceCSVInfoSheet: React.FC<TEvidenceCSVInfoSheetProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        minWidth="min(480px, 100vw)"
        initialWidth="min(560px, 100vw)"
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl leading-8">Evidence CSV format</SheetTitle>
              <X aria-label="Close CSV format sheet" size={20} className="cursor-pointer" onClick={() => onOpenChange(false)} />
            </div>
          </SheetHeader>
        }
      >
        <div className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">Your CSV should contain one evidence request per row. The columns below are the most common fields you can provide.</p>

          <div className="flex flex-col gap-4">
            {EVIDENCE_CSV_FIELDS.map((field) => (
              <div key={field.name} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium">{field.name}</code>
                  {field.required && <span className="text-xs text-muted-foreground">Required</span>}
                </div>
                <p className="text-sm text-muted-foreground">{field.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Example</span>
            <pre className="overflow-x-auto rounded-lg border bg-card p-4 text-xs leading-relaxed">
              <code>{EVIDENCE_CSV_EXAMPLE}</code>
            </pre>
          </div>

          <p className="text-sm text-muted-foreground">
            See the{' '}
            <a href={EVIDENCE_DOCS_URL} target="_blank" rel="noreferrer" className="text-brand hover:underline">
              documentation
            </a>{' '}
            for the full list of available fields.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { EvidenceCSVInfoSheet }
