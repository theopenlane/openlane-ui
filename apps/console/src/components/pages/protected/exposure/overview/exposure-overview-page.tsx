'use client'

import React, { use, useEffect, useMemo, useState } from 'react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { PageHeading } from '@repo/ui/page-heading'
import { useVulnerabilitiesWithFilter } from '@/lib/graphql-hooks/vulnerability'
import { useFindingsWithFilter } from '@/lib/graphql-hooks/finding'
import { useRisks } from '@/lib/graphql-hooks/risk'
import { useScansWithFilter } from '@/lib/graphql-hooks/scan'
import { useReviewsWithFilter } from '@/lib/graphql-hooks/review'
import { OrderDirection, RiskRiskImpact, RiskRiskStatus, VulnerabilityOrderField, FindingOrderField, RiskOrderField, ScanOrderField, ReviewOrderField } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import ExposureQuickActions from './exposure-quick-actions'
import ExposureSeverityChart from './exposure-severity-chart'
import ExposureActivityFeed from './exposure-activity-feed'
import ExposureCriticalCounts from './exposure-critical-counts'
import ItemsRequiringAttention from './items-requiring-attention'
import ConfigureSlaSheet from './configure-sla-sheet'
import { TableKeyEnum } from '@repo/ui/table-key'

const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

const CRIT_WHERE = { or: [{ severityContainsFold: 'critical' }, { severityIn: ['CRITICAL', 'Critical'] }] }
const HIGH_WHERE = { or: [{ severityContainsFold: 'high' }, { severityIn: ['HIGH', 'High'] }] }
const MED_WHERE = { or: [{ severityContainsFold: 'medium' }, { severityIn: ['MEDIUM', 'Medium'] }] }
const LOW_WHERE = { or: [{ severityContainsFold: 'low' }, { severityIn: ['LOW', 'Low'] }] }

const ExposureOverviewPage = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const [slaSheetOpen, setSlaSheetOpen] = useState(false)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Exposure', href: '/exposure/overview' }, { label: 'Overview' }])
  }, [setCrumbs])

  const { data: vulnCritData, vulnerabilitiesNodes: vulnCritNodes } = useVulnerabilitiesWithFilter({ where: { open: true, ...CRIT_WHERE }, pagination: DEFAULT_PAGINATION })
  const { data: vulnHighData, vulnerabilitiesNodes: vulnHighNodes } = useVulnerabilitiesWithFilter({ where: { open: true, ...HIGH_WHERE }, pagination: DEFAULT_PAGINATION })
  const { data: vulnMedData, vulnerabilitiesNodes: vulnMedNodes } = useVulnerabilitiesWithFilter({ where: { open: true, ...MED_WHERE }, pagination: DEFAULT_PAGINATION })
  const { data: vulnLowData, vulnerabilitiesNodes: vulnLowNodes } = useVulnerabilitiesWithFilter({ where: { open: true, ...LOW_WHERE }, pagination: DEFAULT_PAGINATION })

  const { data: findCritData, findingsNodes: findCritNodes } = useFindingsWithFilter({ where: { open: true, ...CRIT_WHERE }, pagination: DEFAULT_PAGINATION })
  const { data: findHighData, findingsNodes: findHighNodes } = useFindingsWithFilter({ where: { open: true, ...HIGH_WHERE }, pagination: DEFAULT_PAGINATION })
  const { data: findMedData, findingsNodes: findMedNodes } = useFindingsWithFilter({ where: { open: true, ...MED_WHERE }, pagination: DEFAULT_PAGINATION })
  const { data: findLowData, findingsNodes: findLowNodes } = useFindingsWithFilter({ where: { open: true, ...LOW_WHERE }, pagination: DEFAULT_PAGINATION })

  const { data: riskCritData, risks: riskCritNodes } = useRisks({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], impactIn: [RiskRiskImpact.CRITICAL] },
    pagination: DEFAULT_PAGINATION,
  })
  const { data: riskHighData, risks: riskHighNodes } = useRisks({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], impactIn: [RiskRiskImpact.HIGH] },
    pagination: DEFAULT_PAGINATION,
  })
  const { data: riskMedData, risks: riskMedNodes } = useRisks({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], impactIn: [RiskRiskImpact.MODERATE] },
    pagination: DEFAULT_PAGINATION,
  })
  const { data: riskLowData, risks: riskLowNodes } = useRisks({ where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], impactIn: [RiskRiskImpact.LOW] }, pagination: DEFAULT_PAGINATION })

  const severityData = useMemo(
    () => ({
      vulns: {
        href: '/exposure/vulnerabilities',
        tableKey: TableKeyEnum.VULNERABILITY,
        critical: vulnCritData?.vulnerabilities?.totalCount ?? 0,
        high: vulnHighData?.vulnerabilities?.totalCount ?? 0,
        medium: vulnMedData?.vulnerabilities?.totalCount ?? 0,
        low: vulnLowData?.vulnerabilities?.totalCount ?? 0,
      },
      findings: {
        href: '/exposure/findings',
        tableKey: TableKeyEnum.FINDING,
        critical: findCritData?.findings?.totalCount ?? 0,
        high: findHighData?.findings?.totalCount ?? 0,
        medium: findMedData?.findings?.totalCount ?? 0,
        low: findLowData?.findings?.totalCount ?? 0,
      },
      risks: {
        href: '/exposure/risks',
        tableKey: TableKeyEnum.RISK,
        critical: riskCritData?.risks?.totalCount ?? 0,
        high: riskHighData?.risks?.totalCount ?? 0,
        medium: riskMedData?.risks?.totalCount ?? 0,
        low: riskLowData?.risks?.totalCount ?? 0,
      },
    }),
    [vulnCritData, vulnHighData, vulnMedData, vulnLowData, findCritData, findHighData, findMedData, findLowData, riskCritData, riskHighData, riskMedData, riskLowData],
  )

  const severityItems = useMemo(
    () => ({
      vulns: {
        critical: vulnCritNodes?.map((v) => v.displayName ?? v.cveID ?? v.displayID ?? v.id) ?? [],
        high: vulnHighNodes?.map((v) => v.displayName ?? v.cveID ?? v.displayID ?? v.id) ?? [],
        medium: vulnMedNodes?.map((v) => v.displayName ?? v.cveID ?? v.displayID ?? v.id) ?? [],
        low: vulnLowNodes?.map((v) => v.displayName ?? v.cveID ?? v.displayID ?? v.id) ?? [],
      },
      findings: {
        critical: findCritNodes?.map((f) => f.displayName ?? f.displayID ?? f.id) ?? [],
        high: findHighNodes?.map((f) => f.displayName ?? f.displayID ?? f.id) ?? [],
        medium: findMedNodes?.map((f) => f.displayName ?? f.displayID ?? f.id) ?? [],
        low: findLowNodes?.map((f) => f.displayName ?? f.displayID ?? f.id) ?? [],
      },
      risks: {
        critical: riskCritNodes?.map((r) => r.name ?? r.displayID ?? r.id) ?? [],
        high: riskHighNodes?.map((r) => r.name ?? r.displayID ?? r.id) ?? [],
        medium: riskMedNodes?.map((r) => r.name ?? r.displayID ?? r.id) ?? [],
        low: riskLowNodes?.map((r) => r.name ?? r.displayID ?? r.id) ?? [],
      },
    }),
    [vulnCritNodes, vulnHighNodes, vulnMedNodes, vulnLowNodes, findCritNodes, findHighNodes, findMedNodes, findLowNodes, riskCritNodes, riskHighNodes, riskMedNodes, riskLowNodes],
  )

  const criticalCounts = useMemo(
    () => ({
      vulns: { critical: severityData.vulns.critical, high: severityData.vulns.high },
      findings: { critical: severityData.findings.critical, high: severityData.findings.high },
      risks: { critical: severityData.risks.critical, high: severityData.risks.high },
    }),
    [severityData],
  )

  const { scansNodes: recentScans } = useScansWithFilter({
    where: { createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: ScanOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { reviewsNodes: recentReviews } = useReviewsWithFilter({
    where: { createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: ReviewOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { vulnerabilitiesNodes: recentVulns } = useVulnerabilitiesWithFilter({
    where: { open: true, createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: VulnerabilityOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { findingsNodes: recentFindings } = useFindingsWithFilter({
    where: { open: true, createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: FindingOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { risks: recentRisks } = useRisks({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: RiskOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const activityItems = useMemo(() => {
    const items: { id: string; label: string; type: string; createdAt: string; href?: string; source?: string | null }[] = []

    recentVulns?.forEach((v) =>
      items.push({
        id: v.id,
        label: v.displayName ?? v.displayID ?? ObjectTypes.VULNERABILITY,
        type: ObjectTypes.VULNERABILITY,
        createdAt: v.createdAt,
        href: `/exposure/vulnerabilities?id=${v.id}`,
        source: v.source ?? null,
      }),
    )
    recentFindings?.forEach((f) =>
      items.push({ id: f.id, label: f.displayName ?? ObjectTypes.FINDING, type: ObjectTypes.FINDING, createdAt: f.createdAt, href: `/exposure/findings?id=${f.id}`, source: f.source ?? null }),
    )
    recentRisks?.forEach((r) => items.push({ id: r.id, label: r.name ?? ObjectTypes.RISK, type: ObjectTypes.RISK, createdAt: r.createdAt }))
    recentScans?.forEach((s) => items.push({ id: s.id, label: s.target ?? ObjectTypes.SCAN, type: ObjectTypes.SCAN, createdAt: s.createdAt }))
    recentReviews?.forEach((r) => items.push({ id: r.id, label: r.title ?? ObjectTypes.REVIEW, type: ObjectTypes.REVIEW, createdAt: r.createdAt }))

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [recentVulns, recentFindings, recentRisks, recentScans, recentReviews])

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
        items.push({ id: v.id, name: v.displayName ?? v.displayID ?? 'Vulnerability', type: ObjectTypes.VULNERABILITY, severity: v.severity ?? '', status: v.status ?? '', createdAt: v.createdAt })
      })
    critFindings
      ?.filter((f) => isCritOrHigh(f.severity ?? ''))
      .forEach((f) => {
        items.push({ id: f.id, name: f.displayName ?? 'Finding', type: ObjectTypes.FINDING, severity: f.severity ?? '', status: f.status ?? '', createdAt: f.createdAt })
      })
    critRisks
      ?.filter((r) => isCritOrHigh(r.impact ?? ''))
      .forEach((r) => {
        items.push({ id: r.id, name: r.name ?? 'Risk', type: ObjectTypes.RISK, severity: r.impact ?? '', status: r.status ?? '', createdAt: r.createdAt })
      })

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
  }, [critVulns, critFindings, critRisks])

  const isLoading = loadingCritVulns || loadingCritFindings || loadingCritRisks

  return (
    <div className="w-full flex justify-center py-4">
      <div className="w-full max-w-308 flex flex-col gap-6">
        <PageHeading heading="Exposure Overview" />
        <ExposureQuickActions />
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <ExposureSeverityChart severityData={severityData} severityItems={severityItems} isLoading={isLoading} />
          </div>
          <div className="col-span-2">
            <ExposureActivityFeed activityItems={activityItems} />
          </div>
        </div>
        <ExposureCriticalCounts counts={criticalCounts} isLoading={isLoading} />
        <ItemsRequiringAttention items={attentionItems} isLoading={isLoading} onConfigureSla={() => setSlaSheetOpen(true)} />
        <ConfigureSlaSheet isOpen={slaSheetOpen} onClose={() => setSlaSheetOpen(false)} />
      </div>
    </div>
  )
}

export default ExposureOverviewPage
