'use client'

import React, { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { InfoIcon, Plus, X } from 'lucide-react'
import { Panel } from '@repo/ui/panel'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { type FindingsNodeNonNull } from '@/lib/graphql-hooks/finding'
import { type ControlReviewFormData } from './use-control-review-form-schema'
import FindingFields from './finding-fields'

type TReviewFindingsPanelProps = {
  findings: FindingsNodeNonNull[]
  totalCount?: number
  isLoading: boolean
  form?: UseFormReturn<ControlReviewFormData>
}

const ReviewFindingsPanel: React.FC<TReviewFindingsPanelProps> = ({ findings, totalCount, isLoading, form }) => {
  const [isAddingFinding, setIsAddingFinding] = useState(false)

  const cancelAddFinding = () => {
    form?.resetField('findingTitle')
    form?.resetField('findingSeverity')
    form?.resetField('findingDescription')
    setIsAddingFinding(false)
  }

  return (
    <Panel className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <InfoIcon size={16} className="text-warning" />
          <p className="text-lg font-medium">Findings</p>
          {!isLoading && <Badge variant="select">{totalCount ?? findings.length}</Badge>}
        </div>
        {form &&
          (isAddingFinding ? (
            <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={cancelAddFinding} aria-label="Remove finding">
              <X size={16} strokeWidth={2} />
            </Button>
          ) : (
            <Button type="button" variant="secondary" className="h-8" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setIsAddingFinding(true)}>
              Add a Finding
            </Button>
          ))}
      </div>

      {isLoading && <Skeleton height={64} />}

      {!isLoading && findings.length === 0 && !isAddingFinding && <p className="text-sm text-muted-foreground">No findings have been raised yet.</p>}

      {!isLoading && (totalCount ?? 0) > findings.length && <p className="text-xs text-muted-foreground">Showing the first {findings.length} findings. Open the Findings tab to see all of them.</p>}

      {!isLoading &&
        findings.map((finding) => (
          <div key={finding.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{finding.displayName || finding.displayID || 'Untitled finding'}</span>
              <div className="flex items-center gap-2 shrink-0">
                <SeverityChip severity={finding.severity} />
                {finding.findingStatusName ? <Badge variant="select">{finding.findingStatusName}</Badge> : null}
              </div>
            </div>
            {finding.description ? <p className="text-sm text-muted-foreground">{finding.description}</p> : null}
          </div>
        ))}

      {form && isAddingFinding && <FindingFields form={form} />}
    </Panel>
  )
}

export default ReviewFindingsPanel
