import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import type { EvidenceLight } from '@/lib/graphql-hooks/evidence'
import { FILTER_LABELS, WORK_ITEM_ROW_CLASS } from './types'
import SectionHeader from './section-header'

type EvidenceRequestsSectionProps = {
  evidenceRequests: EvidenceLight[]
  totalCount: number
  showHeader: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onShowMore: () => void
}

const evidenceHref = (evidence: EvidenceLight): string => {
  const linkedControlId = evidence.controls?.edges?.[0]?.node?.id
  return linkedControlId ? `/controls/${linkedControlId}?controlEvidenceId=${evidence.id}` : `/evidence?id=${evidence.id}`
}

const EvidenceRequestsSection = ({ evidenceRequests, totalCount, showHeader, hasMore, isLoadingMore, onShowMore }: EvidenceRequestsSectionProps) => {
  const router = useRouter()

  if (evidenceRequests.length === 0 && !hasMore) return null

  return (
    <div className="space-y-3">
      {showHeader && <SectionHeader label={FILTER_LABELS.evidenceRequests} count={totalCount} />}
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
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onShowMore} loading={isLoadingMore} disabled={isLoadingMore}>
            {`Show more (${Math.max(totalCount - evidenceRequests.length, 0)})`}
          </Button>
        </div>
      )}
    </div>
  )
}

export default EvidenceRequestsSection
