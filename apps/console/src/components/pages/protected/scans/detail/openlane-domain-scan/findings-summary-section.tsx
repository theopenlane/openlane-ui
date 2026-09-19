'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { getComplianceDocumentLabel, PostureStatus, PostureStatusIcon } from '@/components/shared/enum-mapper/scan-enum'
import { getAgentReadiness, getMissingComplianceLinks, getSecurityViolations, getRisks, getEmailAuthIssues, hasEmailAuth, getWebPostureIssues, hasWebPosture, type ScanMetadata } from './scan-metadata'

type Props = {
  metadata: ScanMetadata | null
}

const FindingsSummarySection: React.FC<Props> = ({ metadata }) => {
  const agentReadiness = getAgentReadiness(metadata)
  const missingComplianceLinks = getMissingComplianceLinks(metadata)
  const securityViolations = getSecurityViolations(metadata)
  const risks = getRisks(metadata)
  const emailAuthIssues = getEmailAuthIssues(metadata)
  const webPostureIssues = getWebPostureIssues(metadata)

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
                <PostureStatusIcon status={PostureStatus.Good} /> None detected
              </span>
            ) : (
              <CountBadge count={securityViolations.length} variant="destructive" />
            )}
          </div>

          <div className="rounded-lg border p-4 flex items-center justify-between">
            <p className="text-sm font-medium">Risks</p>
            {risks.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <PostureStatusIcon status={PostureStatus.Good} /> None detected
              </span>
            ) : (
              <CountBadge count={risks.length} variant="destructive" />
            )}
          </div>

          {hasEmailAuth(metadata) && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Email Authentication</p>
                {emailAuthIssues.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-success">
                    <PostureStatusIcon status={PostureStatus.Good} /> Enforcing
                  </span>
                ) : (
                  <CountBadge count={emailAuthIssues.length} variant="destructive" />
                )}
              </div>
              {emailAuthIssues.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {emailAuthIssues.map((issue) => (
                    <li key={issue.key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <PostureStatusIcon status={issue.status} className="shrink-0" />
                      {issue.label}: {issue.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {hasWebPosture(metadata) && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Web Posture</p>
                {webPostureIssues.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-success">
                    <PostureStatusIcon status={PostureStatus.Good} /> No issues
                  </span>
                ) : (
                  <CountBadge count={webPostureIssues.length} variant="destructive" />
                )}
              </div>
              {webPostureIssues.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {webPostureIssues.map((issue) => (
                    <li key={issue.key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <PostureStatusIcon status={issue.status} className="shrink-0" />
                      {issue.label}: {issue.value}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {agentReadiness && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Agent Readiness</p>
                <span className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                  Level {agentReadiness.level} · {agentReadiness.levelName}
                  {agentReadiness.checklist.length > 0 && <CountBadge count={agentReadiness.checklist.length} variant="destructive" />}
                </span>
              </div>
              {agentReadiness.checklist.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {agentReadiness.checklist.map((item, index) => (
                    <li key={`${index}-${item}`} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <PostureStatusIcon status={PostureStatus.Bad} className="shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {missingComplianceLinks.length > 0 && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Missing Compliance Links</p>
                <CountBadge count={missingComplianceLinks.length} variant="destructive" />
              </div>
              <ul className="space-y-1.5 mt-3">
                {missingComplianceLinks.map((link) => (
                  <li key={link} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <PostureStatusIcon status={PostureStatus.Bad} className="shrink-0" />
                    <CopyableText value={getComplianceDocumentLabel(link)} />
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
