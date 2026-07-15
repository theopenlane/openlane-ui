'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useGetVulnerabilityAssociations } from '@/lib/graphql-hooks/vulnerability'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { getSeverityStyle } from '@/utils/severity'
import { toHumanLabel } from '@/utils/strings'
import PastDueBadge from '@/components/shared/past-due-badge/past-due-badge'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { useSheetNavigation } from '@/providers/sheet-navigation-provider'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getSeverityLabel, getVulnerabilityName, type TriageVuln } from './triage-utils'

type Props = {
  vuln: TriageVuln
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; valueClassName?: string }> = ({ label, value, sub, valueClassName }) => (
  <div className="rounded-lg border bg-card p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${valueClassName ?? ''}`}>{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
)

const TriageDetail: React.FC<Props> = ({ vuln }) => {
  const { data: associations } = useGetVulnerabilityAssociations(vuln.id)
  const { userOptions } = useUserSelect({})
  const sheetNav = useSheetNavigation()

  const severityLabel = getSeverityLabel(vuln)
  const severityStyle = getSeverityStyle(severityLabel)

  const assets = (associations?.vulnerability?.assets?.edges ?? []).map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => Boolean(node))
  const remediationCount = associations?.vulnerability?.remediations?.totalCount ?? 0

  const assigneeName = userOptions.find((option) => option.value === vuln.assignedToUserID)?.label

  const { dueDate, pastDue, daysOverdue, daysUntilDue } = vuln.dueInfo
  const dueSubtitle = (() => {
    if (!dueDate) return 'No SLA set'
    if (pastDue) return `${daysOverdue ?? 0} days overdue`
    return `${daysUntilDue ?? 0} days left`
  })()

  const statusValue = vuln.vulnerabilityStatusName ? toHumanLabel(vuln.vulnerabilityStatusName) : vuln.open ? 'Open' : '—'
  const exploitabilityValue = typeof vuln.exploitability === 'number' && vuln.exploitability !== 0 ? vuln.exploitability.toFixed(1) : '—'

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{vuln.cveID || vuln.externalID || vuln.displayID}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{getVulnerabilityName(vuln)}</h2>
            <span className="rounded-full px-2 py-0.5 text-xs font-medium capitalize" style={severityStyle}>
              {severityLabel}
            </span>
            <PastDueBadge show={pastDue} />
          </div>
        </div>
        <Button
          variant="outline"
          size="md"
          icon={<ExternalLink size={14} />}
          iconPosition="left"
          className="shrink-0"
          onClick={() => sheetNav?.openSheet(vuln.id, ObjectAssociationNodeEnum.VULNERABILITY)}
        >
          Open full details
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="CVSS score" value={typeof vuln.score === 'number' ? vuln.score.toFixed(1) : '—'} sub={<span className="capitalize">{severityLabel}</span>} valueClassName="text-danger" />
        <StatCard label="Exploitability" value={exploitabilityValue} />
        <StatCard
          label="Due date"
          value={dueDate ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          sub={<span className={pastDue ? 'text-danger' : ''}>{dueSubtitle}</span>}
        />
        <StatCard label="Status" value={statusValue} sub={vuln.source ? `Source: ${vuln.source}` : undefined} />
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
              <button
                key={asset.id}
                type="button"
                onClick={() => sheetNav?.openSheet(asset.id, ObjectAssociationNodeEnum.ASSET)}
                className="rounded-md border bg-card px-2.5 py-1 text-sm transition-colors hover:bg-muted"
              >
                {asset.displayName || asset.name}
              </button>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No linked assets</span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ownership</p>
        <p className="mt-2 text-sm">{assigneeName || <span className="text-muted-foreground">Unassigned</span>}</p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
        {vuln.description ? (
          <PlateEditor key={vuln.id} toolbarClassName="hidden" initialValue={vuln.description} readonly variant="readonly" />
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
