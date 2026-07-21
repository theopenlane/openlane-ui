import React from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@repo/ui/badge'
import type { EvidenceLight } from '@/lib/graphql-hooks/evidence'
import { FILTER_LABELS, WORK_ITEM_ROW_CLASS } from './types'

type EvidenceRequestsSectionProps = {
  evidenceRequests: EvidenceLight[]
  showHeader: boolean
}

const evidenceHref = (evidence: EvidenceLight): string => {
  const linkedControlId = evidence.controls?.edges?.[0]?.node?.id
  return linkedControlId ? `/controls/${linkedControlId}?controlEvidenceId=${evidence.id}` : `/evidence?id=${evidence.id}`
}

const EvidenceRequestsSection = ({ evidenceRequests, showHeader }: EvidenceRequestsSectionProps) => {
  const router = useRouter()

  if (evidenceRequests.length === 0) return null

  return (
    <div className="space-y-3">
      {showHeader && (
        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {FILTER_LABELS.evidenceRequests}
          <Badge variant="secondary">{evidenceRequests.length}</Badge>
        </p>
      )}
      {evidenceRequests.map((evidence) => {
        const controlRefCodes = evidence.controls?.edges?.map((edge) => edge?.node?.refCode).filter((refCode): refCode is string => !!refCode)

        return (
          <div key={`evidence-${evidence.id}`} className={WORK_ITEM_ROW_CLASS} onClick={() => router.push(evidenceHref(evidence))}>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{evidence.name}</p>
              {controlRefCodes && controlRefCodes.length > 0 && <p className="text-xs text-muted-foreground truncate">Requested for {controlRefCodes.join(', ')}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default EvidenceRequestsSection
