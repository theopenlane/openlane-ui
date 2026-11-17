import { useMemo } from 'react'
import { useVulnerabilityActivity } from '@/lib/graphql-hooks/vulnerability'
import { useFindingActivity } from '@/lib/graphql-hooks/finding'
import { useRiskActivity } from '@/lib/graphql-hooks/risk'
import { useScanActivity } from '@/lib/graphql-hooks/scan'
import { useReviewActivity } from '@/lib/graphql-hooks/review'
import { useInternalPolicyActivity } from '@/lib/graphql-hooks/internal-policy'
import { useControlActivity } from '@/lib/graphql-hooks/control'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { getNotificationHref } from '@/components/shared/SystemNotification/notification-redirect'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { getObjectDisplayName } from '@/utils/object-display-name'
import { getVulnerabilityTitle } from '@/components/pages/protected/vulnerabilities/vulnerability-display'
import {
  OrderDirection,
  VulnerabilityOrderField,
  FindingOrderField,
  RiskOrderField,
  ScanOrderField,
  ReviewOrderField,
  ControlOrderField,
  InternalPolicyOrderField,
  RiskRiskStatus,
  NotificationNotificationTopic,
} from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'

const ACTIVITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const ACTIVITY_WINDOW_BUCKET_MS = 60 * 60 * 1000 // 1hr

const ACTIVITY_WINDOW_START = new Date(Math.floor(Date.now() / ACTIVITY_WINDOW_BUCKET_MS) * ACTIVITY_WINDOW_BUCKET_MS - ACTIVITY_WINDOW_MS).toISOString()

const RECENT_ACTIVITY_LIMIT = 10
const CREATED_ACTIVITY_LIMIT = 50

export type ActivityItem = {
  id: string
  label: string
  type: string
  createdAt: string | null
  href?: string
  source?: string | null
  isGrouped?: boolean
}

const activityTimestamp = (createdAt: string | null | undefined): number => (createdAt ? new Date(createdAt).getTime() : 0)

const byNewestFirst = (a: ActivityItem, b: ActivityItem) => activityTimestamp(b.createdAt) - activityTimestamp(a.createdAt)

const pluralizeLabel = (label: string): string => {
  if (/[bcdfghjklmnpqrstvwxyz]y$/i.test(label)) return `${label.slice(0, -1)}ies`
  if (/(?:s|x|z|ch|sh)$/i.test(label)) return `${label}es`
  return `${label}s`
}

const pushCreatedActivity = <T extends { id: string; createdAt?: string | null }>(
  items: ActivityItem[],
  records: T[],
  totalCount: number,
  type: string,
  listHref: string,
  labelFor: (record: T) => string,
  hrefFor: (record: T) => string,
) => {
  if (records.length === 0) return

  if (totalCount === 1) {
    const record = records[0]
    items.push({ id: record.id, label: labelFor(record), type, createdAt: record.createdAt ?? null, href: hrefFor(record) })
    return
  }

  const mostRecent = records.reduce((latest, record) => (activityTimestamp(record.createdAt) > activityTimestamp(latest.createdAt) ? record : latest))
  items.push({
    id: `group-${type}`,
    label: `${totalCount} ${pluralizeLabel(toHumanLabel(type))}`,
    type,
    createdAt: mostRecent.createdAt ?? null,
    href: listHref,
    isGrouped: true,
  })
}

type RemainingActivitySource = { records: { createdAt?: string | null }[]; totalCount: number; type: string; listHref: string }

const pushRemainingActivity = (items: ActivityItem[], { records, totalCount, type, listHref }: RemainingActivitySource) => {
  if (records.length === 0 || totalCount <= records.length) return

  const remaining = totalCount - records.length
  const typeLabel = toHumanLabel(type)
  const oldest = records.reduce((earliest, record) => (activityTimestamp(record.createdAt) < activityTimestamp(earliest.createdAt) ? record : earliest))
  items.push({
    id: `remaining-${type}`,
    label: `${remaining} more ${remaining === 1 ? typeLabel : pluralizeLabel(typeLabel)}`,
    type,
    createdAt: oldest.createdAt ?? null,
    href: listHref,
    isGrouped: true,
  })
}

type VulnNode = { id: string; cveID?: string | null; displayName?: string | null; externalID?: string | null; displayID?: string | null; createdAt?: string | null; source?: string | null }

const vulnActivityItem = (v: VulnNode): ActivityItem => ({
  id: v.id,
  label: getVulnerabilityTitle(v),
  type: ObjectTypes.VULNERABILITY,
  createdAt: v.createdAt ?? null,
  href: getHrefForObjectType('vulnerabilities', { id: v.id }),
  source: v.source ?? null,
})

const pushVulnerabilityActivity = (items: ActivityItem[], vulns: VulnNode[], groupBySource: boolean, isCapped: boolean) => {
  if (vulns.length === 0) return

  if (!groupBySource) {
    vulns.forEach((v) => items.push(vulnActivityItem(v)))
    return
  }

  const bySource = new Map<string, VulnNode[]>()
  vulns.forEach((v) => {
    const key = v.source ?? ''
    bySource.set(key, [...(bySource.get(key) ?? []), v])
  })

  bySource.forEach((group, source) => {
    if (group.length === 1) {
      items.push(vulnActivityItem(group[0]))
      return
    }

    const mostRecent = group.reduce((latest, v) => (activityTimestamp(v.createdAt) > activityTimestamp(latest.createdAt) ? v : latest))
    items.push({
      id: `group-${ObjectTypes.VULNERABILITY}-${source || 'unknown'}`,
      label: `${group.length}${isCapped ? '+' : ''} Vulnerabilities`,
      type: ObjectTypes.VULNERABILITY,
      createdAt: mostRecent.createdAt ?? null,
      href: '/exposure/vulnerabilities',
      source: source || null,
      isGrouped: true,
    })
  })
}

type ControlNode = { id: string; refCode?: string | null; title?: string | null; createdAt?: string | null }
type PolicyNode = { id: string; name?: string | null; createdAt?: string | null }

const controlLabel = (c: ControlNode) => (c.title ? `${c.refCode} — ${c.title}` : (c.refCode ?? ObjectTypes.CONTROL))
const controlHref = (c: ControlNode) => `/controls/${c.id}`
const policyHref = (p: PolicyNode) => `/policies/${p.id}/view`

export const useRecentActivityItems = ({ includeNonExposureActivity = true }: { includeNonExposureActivity?: boolean } = {}) => {
  const vulnsQuery = useVulnerabilityActivity({
    where: { open: true, createdAtGTE: ACTIVITY_WINDOW_START },
    orderBy: [{ field: VulnerabilityOrderField.created_at, direction: OrderDirection.DESC }],
    first: RECENT_ACTIVITY_LIMIT,
  })

  const findingsQuery = useFindingActivity({
    where: { open: true, createdAtGTE: ACTIVITY_WINDOW_START },
    orderBy: [{ field: FindingOrderField.created_at, direction: OrderDirection.DESC }],
    first: RECENT_ACTIVITY_LIMIT,
  })

  const risksQuery = useRiskActivity({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], createdAtGTE: ACTIVITY_WINDOW_START },
    orderBy: [{ field: RiskOrderField.created_at, direction: OrderDirection.DESC }],
    first: RECENT_ACTIVITY_LIMIT,
  })

  const scansQuery = useScanActivity({
    where: { createdAtGTE: ACTIVITY_WINDOW_START },
    orderBy: [{ field: ScanOrderField.created_at, direction: OrderDirection.DESC }],
    first: RECENT_ACTIVITY_LIMIT,
  })

  const reviewsQuery = useReviewActivity({
    where: { createdAtGTE: ACTIVITY_WINDOW_START },
    orderBy: [{ field: ReviewOrderField.created_at, direction: OrderDirection.DESC }],
    first: RECENT_ACTIVITY_LIMIT,
  })

  const policiesQuery = useInternalPolicyActivity({
    where: { createdAtGTE: ACTIVITY_WINDOW_START },
    orderBy: [{ field: InternalPolicyOrderField.created_at, direction: OrderDirection.DESC }],
    first: CREATED_ACTIVITY_LIMIT,
    enabled: includeNonExposureActivity,
  })

  const controlsQuery = useControlActivity({
    where: { createdAtGTE: ACTIVITY_WINDOW_START, systemOwned: false, isTrustCenterControl: false },
    orderBy: [{ field: ControlOrderField.created_at, direction: OrderDirection.DESC }],
    first: CREATED_ACTIVITY_LIMIT,
    enabled: includeNonExposureActivity,
  })

  const { vulnerabilities: recentVulns, totalCount: recentVulnsCount } = vulnsQuery
  const { findings: recentFindings, totalCount: recentFindingsCount } = findingsQuery
  const { risks: recentRisks, totalCount: recentRisksCount } = risksQuery
  const { scans: recentScans, totalCount: recentScansCount } = scansQuery
  const { reviews: recentReviews, totalCount: recentReviewsCount } = reviewsQuery
  const { internalPolicies: nonExposurePolicies, totalCount: recentPoliciesCount } = policiesQuery
  const { controls: nonExposureControls, totalCount: recentControlsCount } = controlsQuery

  const { notifications } = useNotificationsContext()
  const recentMentions = useMemo(
    () =>
      includeNonExposureActivity
        ? notifications.filter((notification) => notification.topic === NotificationNotificationTopic.MENTION && notification.createdAt && notification.createdAt >= ACTIVITY_WINDOW_START)
        : [],
    [notifications, includeNonExposureActivity],
  )

  const baseItems = useMemo(() => {
    const items: ActivityItem[] = []

    recentFindings.forEach((f) =>
      items.push({
        id: f.id,
        label: getObjectDisplayName(f) || ObjectTypes.FINDING,
        type: ObjectTypes.FINDING,
        createdAt: f.createdAt,
        href: getHrefForObjectType('findings', { id: f.id }),
        source: f.source ?? null,
      }),
    )
    recentRisks.forEach((r) => items.push({ id: r.id, label: getObjectDisplayName(r) || ObjectTypes.RISK, type: ObjectTypes.RISK, createdAt: r.createdAt }))
    recentScans.forEach((s) => items.push({ id: s.id, label: getObjectDisplayName(s) || ObjectTypes.SCAN, type: ObjectTypes.SCAN, createdAt: s.createdAt }))
    recentReviews.forEach((r) => items.push({ id: r.id, label: getObjectDisplayName(r) || ObjectTypes.REVIEW, type: ObjectTypes.REVIEW, createdAt: r.createdAt }))
    recentMentions.forEach((notification) =>
      items.push({
        id: notification.id,
        label: notification.title,
        type: 'Mention',
        createdAt: notification.createdAt ?? null,
        href: getNotificationHref(notification),
      }),
    )

    return items
  }, [recentFindings, recentRisks, recentScans, recentReviews, recentMentions])

  const activityItems = useMemo(() => {
    const items = [...baseItems]
    pushVulnerabilityActivity(items, recentVulns, includeNonExposureActivity, recentVulnsCount > recentVulns.length)
    pushCreatedActivity(items, nonExposurePolicies, recentPoliciesCount, ObjectTypes.INTERNAL_POLICY, '/policies', (p) => getObjectDisplayName(p) || ObjectTypes.INTERNAL_POLICY, policyHref)
    pushCreatedActivity(items, nonExposureControls, recentControlsCount, ObjectTypes.CONTROL, '/controls', controlLabel, controlHref)
    return items.sort(byNewestFirst)
  }, [baseItems, recentVulns, recentVulnsCount, nonExposurePolicies, nonExposureControls, recentPoliciesCount, recentControlsCount, includeNonExposureActivity])

  const allActivityItems = useMemo(() => {
    const items = [...baseItems]
    pushVulnerabilityActivity(items, recentVulns, false, false)
    nonExposurePolicies.forEach((p) =>
      items.push({ id: p.id, label: getObjectDisplayName(p) || ObjectTypes.INTERNAL_POLICY, type: ObjectTypes.INTERNAL_POLICY, createdAt: p.createdAt ?? null, href: policyHref(p) }),
    )
    nonExposureControls.forEach((c) => items.push({ id: c.id, label: controlLabel(c), type: ObjectTypes.CONTROL, createdAt: c.createdAt ?? null, href: controlHref(c) }))
    const remainingSources: RemainingActivitySource[] = [
      { records: recentVulns, totalCount: recentVulnsCount, type: ObjectTypes.VULNERABILITY, listHref: '/exposure/vulnerabilities' },
      { records: recentFindings, totalCount: recentFindingsCount, type: ObjectTypes.FINDING, listHref: '/exposure/findings' },
      { records: recentRisks, totalCount: recentRisksCount, type: ObjectTypes.RISK, listHref: '/exposure/risks' },
      { records: recentScans, totalCount: recentScansCount, type: ObjectTypes.SCAN, listHref: '/exposure/scans' },
      { records: recentReviews, totalCount: recentReviewsCount, type: ObjectTypes.REVIEW, listHref: '/exposure/reviews' },
      { records: nonExposurePolicies, totalCount: recentPoliciesCount, type: ObjectTypes.INTERNAL_POLICY, listHref: '/policies' },
      { records: nonExposureControls, totalCount: recentControlsCount, type: ObjectTypes.CONTROL, listHref: '/controls' },
    ]
    remainingSources.forEach((source) => pushRemainingActivity(items, source))
    return items.sort(byNewestFirst)
  }, [
    baseItems,
    recentVulns,
    recentVulnsCount,
    recentFindings,
    recentFindingsCount,
    recentRisks,
    recentRisksCount,
    recentScans,
    recentScansCount,
    recentReviews,
    recentReviewsCount,
    nonExposurePolicies,
    nonExposureControls,
    recentPoliciesCount,
    recentControlsCount,
  ])

  const isLoading = [vulnsQuery, findingsQuery, risksQuery, scansQuery, reviewsQuery, policiesQuery, controlsQuery].some((query) => query.isLoading)

  return { activityItems, allActivityItems, isLoading }
}
