'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { InfoSlideOut } from '@repo/ui/info-slide-out'
import { useNotification } from '@/hooks/useNotification'
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
  const { successNotification } = useNotification()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(EVIDENCE_CSV_EXAMPLE)
    setCopied(true)
    successNotification({ title: 'Copied to clipboard' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <InfoSlideOut title="Evidence CSV format" docsUrl={EVIDENCE_DOCS_URL} width={560} open={open} onOpenChange={onOpenChange}>
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Example</span>
            <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy example CSV">
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-card p-4 text-xs leading-relaxed">
            <code>{EVIDENCE_CSV_EXAMPLE}</code>
          </pre>
        </div>
      </div>
    </InfoSlideOut>
  )
}

export { EvidenceCSVInfoSheet }
