'use client'

import React from 'react'
import { CircleCheck, CircleX } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { getAgentReadiness, getMissingComplianceLinks, getSecurityViolations, getRisks, type ScanMetadata } from './scan-metadata'

type Props = {
  metadata: ScanMetadata | null
}

const FindingsSummarySection: React.FC<Props> = ({ metadata }) => {
  const agentReadiness = getAgentReadiness(metadata)
  const missingComplianceLinks = getMissingComplianceLinks(metadata)
  const securityViolations = getSecurityViolations(metadata)
  const risks = getRisks(metadata)

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-lg font-medium leading-7">Findings Summary</p>
        <p className="text-sm text-muted-foreground mb-4">Key findings from this scan</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <p className="text-sm font-medium">Security Violations</p>
            {securityViolations.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <CircleCheck size={14} /> None detected
              </span>
            ) : (
              <CountBadge count={securityViolations.length} variant="destructive" />
            )}
          </div>

          <div className="rounded-lg border p-4 flex items-center justify-between">
            <p className="text-sm font-medium">Risks</p>
            {risks.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <CircleCheck size={14} /> None detected
              </span>
            ) : (
              <CountBadge count={risks.length} variant="destructive" />
            )}
          </div>

          {agentReadiness && (
            <div className="rounded-lg border p-4 flex items-center justify-between">
              <p className="text-sm font-medium">Agent Readiness</p>
              <span className="text-sm text-muted-foreground">
                Level {agentReadiness.level} · {agentReadiness.levelName}
              </span>
            </div>
          )}

          {missingComplianceLinks.length > 0 && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-3">Missing Compliance Links</p>
              <ul className="space-y-1.5">
                {missingComplianceLinks.map((link) => (
                  <li key={link} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CircleX size={14} className="text-destructive shrink-0" />
                    <CopyableText value={link} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FindingsSummarySection
