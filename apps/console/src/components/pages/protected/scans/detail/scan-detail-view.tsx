'use client'

import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { ExternalLink } from 'lucide-react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ScanTypeIconMapper, ScanStatusBadge } from '@/components/shared/enum-mapper/scan-enum'
import { formatDateTime } from '@/utils/date'
import type { ScanDetailNode } from '@/lib/graphql-hooks/scan'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import LinkedObjectsSection from './linked-objects-section'
import CompanySection from './openlane-domain-scan/company-section'
import DiscoveredVendorsSection from './openlane-domain-scan/discovered-vendors-section'
import FindingsSummarySection from './openlane-domain-scan/findings-summary-section'
import DiscoverySection from './discovery-section'
import RawMetadataSection from './raw-metadata-section'
import { parseScanMetadata, hasFindingsSummary, hasCompanyInfo, getVendors, OPENLANE_DOMAIN_SCAN_PERFORMER } from './openlane-domain-scan/scan-metadata'

type Props = {
  data: ScanDetailNode
}

const getResponsibility = (user?: { displayName?: string | null } | null, group?: { displayName?: string | null } | null, stringValue?: string | null) =>
  user?.displayName ?? group?.displayName ?? stringValue ?? '-'

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="text-sm">{children}</div>
  </div>
)

const ScanDetailView: React.FC<Props> = ({ data }) => {
  const metadata = parseScanMetadata(data.metadata)
  const performedBy = getResponsibility(data.performedByUser, data.performedByGroup, data.performedBy)
  const targetUrl = metadata?.url ?? (data.target.startsWith('http') ? data.target : `https://${data.target}`)
  const hasScopeOrEnvironment = !!data.environmentName || !!data.scopeName
  const isDomainScanFormat = data.performedBy === OPENLANE_DOMAIN_SCAN_PERFORMER

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="pt-6 grid grid-cols-3 gap-x-6 gap-y-4">
          <Field label="Scan Type">
            <div className="flex items-center gap-1.5">
              {ScanTypeIconMapper[data.scanType]}
              {getEnumLabel(data.scanType)}
            </div>
          </Field>
          <Field label="Target">
            <div className="flex items-center gap-1.5">
              <CopyableText value={data.target} />
              {metadata?.url && (
                <a href={targetUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </Field>
          <Field label="Status">
            <ScanStatusBadge status={data.status} />
          </Field>

          <Field label="Performed By">
            <span className="font-mono text-xs">{performedBy}</span>
          </Field>
          <Field label="Scan Date">{formatDateTime(data.scanDate)}</Field>
        </CardContent>
      </Card>

      {hasScopeOrEnvironment && (
        <Card>
          <CardContent className="pt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {data.environmentName && <Field label="Environment">{data.environmentName}</Field>}
            {data.scopeName && <Field label="Scope">{data.scopeName}</Field>}
          </CardContent>
        </Card>
      )}

      <LinkedObjectsSection scanId={data.id} />

      {isDomainScanFormat && (
        <>
          {hasCompanyInfo(metadata) && <CompanySection metadata={metadata} />}

          {getVendors(metadata).length > 0 && <DiscoveredVendorsSection metadata={metadata} />}
        </>
      )}

      <DiscoverySection metadata={metadata} rawMetadata={data.metadata} />

      {isDomainScanFormat && hasFindingsSummary(metadata) && <FindingsSummarySection metadata={metadata} />}

      {metadata && <RawMetadataSection metadata={metadata} />}
    </div>
  )
}

export default ScanDetailView
