'use client'

import React, { use, useEffect, useMemo, useState } from 'react'
import { getVulnerabilityTitle } from '@/components/pages/protected/vulnerabilities/vulnerability-display'
import { getObjectDisplayName } from '@/utils/object-display-name'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { PageHeading } from '@theopenlane/ui/page-heading'
import { useVulnerabilitiesWithFilter, useVulnerabilityActivity } from '@/lib/graphql-hooks/vulnerability'
import { useFindingActivity, useFindingsWithFilter } from '@/lib/graphql-hooks/finding'
import { useRiskActivity, useRisks } from '@/lib/graphql-hooks/risk'
import { OrderDirection, RiskRiskImpact, RiskRiskStatus, VulnerabilityOrderField, FindingOrderField, RiskOrderField } from '@repo/codegen/src/schema'
import { useRecentActivityItems } from '@/components/shared/activity-feed/use-recent-activity-items'
import { Button } from '@theopenlane/ui/button'
import { Settings } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import ExposureQuickActions from './exposure-quick-actions'
import ExposureSeverityChart from './exposure-severity-chart'
import ActivityFeed from '@/components/shared/activity-feed/activity-feed'
import ExposureCriticalCounts from './exposure-critical-counts'
import ItemsRequiringAttention from './items-requiring-attention'
import ConfigureSlaSheet from './configure-sla-sheet'
import { TableKeyEnum } from '@theopenlane/ui/table-key'
import { useSession } from 'next-auth/react'
import { useHasObjectType } from '@/lib/subscription-plan/hooks/use-module-access'
import MenuItem from '@/components/shared/menu/menu-item'

const CRIT_WHERE = { or: [{ severityContainsFold: 'critical' }, { severityIn: ['CRITICAL', 'Critical'] }] }
const HIGH_WHERE = { or: [{ severityContainsFold: 'high' }, { severityIn: ['HIGH', 'High'] }] }
const MED_WHERE = { or: [{ severityContainsFold: 'medium' }, { severityIn: ['MEDIUM', 'Medium'] }] }
const LOW_WHERE = { or: [{ severityContainsFold: 'low' }, { severityIn: ['LOW', 'Low'] }] }
const OPEN_RISK_WHERE = { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED] }
const SEVERITY_SAMPLE_SIZE = 10

const ExposureOverviewPage = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const [slaSheetOpen, setSlaSheetOpen] = useState(false)
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const hasWriteAccess = canEdit(orgPermission?.roles, session)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Exposure', href: '/exposure/overview' }, { label: 'Overview' }])
  }, [setCrumbs])

  const vulnCrit = useVulnerabilityActivity({ where: { open: true, ...CRIT_WHERE }, first: SEVERITY_SAMPLE_SIZE })
  const vulnHigh = useVulnerabilityActivity({ where: { open: true, ...HIGH_WHERE }, first: SEVERITY_SAMPLE_SIZE })
  const vulnMed = useVulnerabilityActivity({ where: { open: true, ...MED_WHERE }, first: SEVERITY_SAMPLE_SIZE })
  const vulnLow = useVulnerabilityActivity({ where: { open: true, ...LOW_WHERE }, first: SEVERITY_SAMPLE_SIZE })

  const findCrit = useFindingActivity({ where: { open: true, ...CRIT_WHERE }, first: SEVERITY_SAMPLE_SIZE })
  const findHigh = useFindingActivity({ where: { open: true, ...HIGH_WHERE }, first: SEVERITY_SAMPLE_SIZE })
  const findMed = useFindingActivity({ where: { open: true, ...MED_WHERE }, first: SEVERITY_SAMPLE_SIZE })
  const findLow = useFindingActivity({ where: { open: true, ...LOW_WHERE }, first: SEVERITY_SAMPLE_SIZE })

  const hasRiskAccess = useHasObjectType(ObjectTypes.RISK)
  const riskCrit = useRiskActivity({ where: { ...OPEN_RISK_WHERE, impactIn: [RiskRiskImpact.CRITICAL] }, first: SEVERITY_SAMPLE_SIZE })
  const riskHigh = useRiskActivity({ where: { ...OPEN_RISK_WHERE, impactIn: [RiskRiskImpact.HIGH] }, first: SEVERITY_SAMPLE_SIZE })
  const riskMed = useRiskActivity({ where: { ...OPEN_RISK_WHERE, impactIn: [RiskRiskImpact.MODERATE] }, first: SEVERITY_SAMPLE_SIZE })
  const riskLow = useRiskActivity({ where: { ...OPEN_RISK_WHERE, impactIn: [RiskRiskImpact.LOW] }, first: SEVERITY_SAMPLE_SIZE })

  const severityData = useMemo(
    () => ({
      vulns: {
        href: '/exposure/vulnerabilities',
        tableKey: TableKeyEnum.VULNERABILITY,
        critical: vulnCrit.totalCount,
        high: vulnHigh.totalCount,
        medium: vulnMed.totalCount,
        low: vulnLow.totalCount,
      },
      findings: {
        href: '/exposure/findings',
        tableKey: TableKeyEnum.FINDING,
        critical: findCrit.totalCount,
        high: findHigh.totalCount,
        medium: findMed.totalCount,
        low: findLow.totalCount,
      },
      risks: {
        href: '/exposure/risks',
        tableKey: TableKeyEnum.RISK,
        critical: riskCrit.totalCount,
        high: riskHigh.totalCount,
        medium: riskMed.totalCount,
        low: riskLow.totalCount,
      },
    }),
    [
      vulnCrit.totalCount,
      vulnHigh.totalCount,
      vulnMed.totalCount,
      vulnLow.totalCount,
      findCrit.totalCount,
      findHigh.totalCount,
      findMed.totalCount,
      findLow.totalCount,
      riskCrit.totalCount,
      riskHigh.totalCount,
      riskMed.totalCount,
      riskLow.totalCount,
    ],
  )

  const severityItems = useMemo(
    () => ({
      vulns: {
        critical: vulnCrit.vulnerabilities.map(getVulnerabilityTitle),
        high: vulnHigh.vulnerabilities.map(getVulnerabilityTitle),
        medium: vulnMed.vulnerabilities.map(getVulnerabilityTitle),
        low: vulnLow.vulnerabilities.map(getVulnerabilityTitle),
      },
      findings: {
        critical: findCrit.findings.map((f) => getObjectDisplayName(f) || 'Finding'),
        high: findHigh.findings.map((f) => getObjectDisplayName(f) || 'Finding'),
        medium: findMed.findings.map((f) => getObjectDisplayName(f) || 'Finding'),
        low: findLow.findings.map((f) => getObjectDisplayName(f) || 'Finding'),
      },
      risks: {
        critical: riskCrit.risks.map((r) => getObjectDisplayName(r) || 'Risk'),
        high: riskHigh.risks.map((r) => getObjectDisplayName(r) || 'Risk'),
        medium: riskMed.risks.map((r) => getObjectDisplayName(r) || 'Risk'),
        low: riskLow.risks.map((r) => getObjectDisplayName(r) || 'Risk'),
      },
    }),
    [
      vulnCrit.vulnerabilities,
      vulnHigh.vulnerabilities,
      vulnMed.vulnerabilities,
      vulnLow.vulnerabilities,
      findCrit.findings,
      findHigh.findings,
      findMed.findings,
      findLow.findings,
      riskCrit.risks,
      riskHigh.risks,
      riskMed.risks,
      riskLow.risks,
    ],
  )

  const criticalCounts = useMemo(
    () => ({
      vulns: { critical: severityData.vulns.critical, high: severityData.vulns.high },
      findings: { critical: severityData.findings.critical, high: severityData.findings.high },
      risks: { critical: severityData.risks.critical, high: severityData.risks.high },
    }),
    [severityData],
  )

  const { activityItems, allActivityItems, isLoading: isActivityLoading } = useRecentActivityItems({ includeNonExposureActivity: false })

  const { vulnerabilitiesNodes: critVulns, isLoading: loadingCritVulns } = useVulnerabilitiesWithFilter({
    where: { open: true },
    orderBy: [{ field: VulnerabilityOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { findingsNodes: critFindings, isLoading: loadingCritFindings } = useFindingsWithFilter({
    where: { open: true },
    orderBy: [{ field: FindingOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { risks: critRisks, isLoading: loadingCritRisks } = useRisks({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED] },
    orderBy: [{ field: RiskOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
    enabled: hasRiskAccess,
  })

  const attentionItems = useMemo(() => {
    const isCritOrHigh = (sev: string) => {
      const s = sev.toLowerCase()
      return s.includes('critical') || s.includes('high')
    }

    const items: { id: string; name: string; type: typeof ObjectTypes.VULNERABILITY | typeof ObjectTypes.FINDING | typeof ObjectTypes.RISK; severity: string; status: string; createdAt: string }[] = []

    critVulns
      ?.filter((v) => isCritOrHigh(v.severity ?? ''))
      .forEach((v) => {
        items.push({
          id: v.id,
          name: getVulnerabilityTitle(v),
          type: ObjectTypes.VULNERABILITY,
          severity: v.severity ?? '',
          status: v.vulnerabilityStatusName ?? '',
          createdAt: v.createdAt,
        })
      })
    critFindings
      ?.filter((f) => isCritOrHigh(f.severity ?? ''))
      .forEach((f) => {
        items.push({ id: f.id, name: getObjectDisplayName(f) || 'Finding', type: ObjectTypes.FINDING, severity: f.severity ?? '', status: f.findingStatusName ?? '', createdAt: f.createdAt })
      })
    critRisks
      ?.filter((r) => isCritOrHigh(r.impact ?? ''))
      .forEach((r) => {
        items.push({ id: r.id, name: getObjectDisplayName(r) || 'Risk', type: ObjectTypes.RISK, severity: r.impact ?? '', status: r.status ?? '', createdAt: r.createdAt })
      })

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
  }, [critVulns, critFindings, critRisks])

  const isLoading = loadingCritVulns || loadingCritFindings || loadingCritRisks

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-308 flex flex-col gap-6">
        <PageHeading
          heading="Exposure Overview"
          actions={
            <Menu
              trigger={
                <Button variant="secondary" size="md" className="gap-1.5" aria-label="Exposure settings">
                  <Settings size={14} />
                </Button>
              }
              content={
                <MenuItem icon={<Settings size={16} strokeWidth={2} />} onSelect={() => setSlaSheetOpen(true)}>
                  {hasWriteAccess ? 'Configure SLA' : 'View SLA'}
                </MenuItem>
              }
            />
          }
        />
        <ExposureQuickActions />
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <ExposureSeverityChart severityData={severityData} severityItems={severityItems} isLoading={isLoading} />
          </div>
          <div className="col-span-2">
            <ActivityFeed activityItems={activityItems} allActivityItems={allActivityItems} isLoading={isActivityLoading} />
          </div>
        </div>
        <ExposureCriticalCounts counts={criticalCounts} isLoading={isLoading} />
        <ItemsRequiringAttention items={attentionItems} isLoading={isLoading} />
        <ConfigureSlaSheet isOpen={slaSheetOpen} onClose={() => setSlaSheetOpen(false)} readOnly={!hasWriteAccess} />
      </div>
    </div>
  )
}

export default ExposureOverviewPage
