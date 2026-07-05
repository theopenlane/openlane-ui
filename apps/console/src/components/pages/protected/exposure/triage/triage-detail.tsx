'use client'

import React, { useMemo } from 'react'
import { useGetVulnerabilityAssociations } from '@/lib/graphql-hooks/vulnerability'
import { useHtmlPurifier, HTML_SANITIZE_CONFIG } from '@/lib/html/sanitize-html'
import { getSeverityStyle } from '@/utils/severity'
import PastDueBadge from '@/components/shared/past-due-badge/past-due-badge'
import AssigneeSelect from './assignee-select'
import { getSeverityLabel, type TriageVuln } from './triage-utils'

type Props = {
  vuln: TriageVuln
  onAssign: (userId: string | null) => void
  isAssigning?: boolean
  canEdit: boolean
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; valueClassName?: string }> = ({ label, value, sub, valueClassName }) => (
  <div className="rounded-lg border bg-card p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${valueClassName ?? ''}`}>{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
)

const TriageDetail: React.FC<Props> = ({ vuln, onAssign, isAssigning, canEdit }) => {
  const { data: associations } = useGetVulnerabilityAssociations(vuln.id)
  const purifier = useHtmlPurifier()

  const severityLabel = getSeverityLabel(vuln)
  const severityStyle = getSeverityStyle(severityLabel)

  const assets = (associations?.vulnerability?.assets?.edges ?? []).map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => Boolean(node))
  const remediationCount = associations?.vulnerability?.remediations?.totalCount ?? 0

  const sanitizedDescription = useMemo(() => (vuln.description ? purifier.sanitize(vuln.description, HTML_SANITIZE_CONFIG) : ''), [purifier, vuln.description])

  const { dueDate, pastDue, daysOverdue, daysUntilDue } = vuln.dueInfo
  const dueSubtitle = (() => {
    if (!dueDate) return 'No SLA set'
    if (pastDue) return `${daysOverdue ?? 0} days overdue`
    return `${daysUntilDue ?? 0} days left`
  })()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{vuln.displayID || vuln.externalID}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{vuln.displayName || vuln.displayID}</h2>
          <span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={severityStyle}>
            {severityLabel}
          </span>
          <PastDueBadge show={pastDue} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CVSS score" value={typeof vuln.score === 'number' ? vuln.score.toFixed(1) : '—'} sub={<span className="capitalize">{severityLabel}</span>} valueClassName="text-danger" />
        <StatCard label="Exploitability" value={typeof vuln.exploitability === 'number' ? vuln.exploitability.toFixed(1) : '—'} />
        <StatCard
          label="Due date"
          value={dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          sub={<span className={pastDue ? 'text-danger' : ''}>{dueSubtitle}</span>}
        />
        <StatCard label="Status" value={vuln.vulnerabilityStatusName || (vuln.open ? 'Open' : '—')} sub={vuln.source ? `Source: ${vuln.source}` : undefined} />
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Remediation</p>
        <p className="mt-2 text-sm">{remediationCount > 0 ? `${remediationCount} remediation${remediationCount === 1 ? '' : 's'} tracked` : 'No remediation tracked'}</p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Affected services</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {assets.length > 0 ? (
            assets.map((asset) => (
              <span key={asset.id} className="rounded-md border bg-card px-2.5 py-1 text-sm">
                {asset.displayName || asset.name}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No linked assets</span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ownership</p>
        <div className="mt-2 max-w-xs">
          <AssigneeSelect value={vuln.externalOwnerID} onAssign={onAssign} disabled={isAssigning || !canEdit} />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
        {sanitizedDescription ? (
          <div className="prose prose-sm mt-2 max-w-none rounded-lg border bg-card p-4 dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
        ) : vuln.summary ? (
          <p className="mt-2 rounded-lg border bg-card p-4 text-sm">{vuln.summary}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No description provided.</p>
        )}
      </div>
    </div>
  )
}

export default TriageDetail
