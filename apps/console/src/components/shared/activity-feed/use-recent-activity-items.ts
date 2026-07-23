import { useMemo } from 'react'
import { useVulnerabilitiesWithFilter } from '@/lib/graphql-hooks/vulnerability'
import { useFindingsWithFilter } from '@/lib/graphql-hooks/finding'
import { useRisks } from '@/lib/graphql-hooks/risk'
import { useScansWithFilter } from '@/lib/graphql-hooks/scan'
import { useReviewsWithFilter } from '@/lib/graphql-hooks/review'
import { useInternalPolicies } from '@/lib/graphql-hooks/internal-policy'
import { useGetAllControls } from '@/lib/graphql-hooks/control'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { getNotificationRedirectUrl } from '@/components/shared/SystemNotification/notification-redirect'
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
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'

const ACTIVITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const ACTIVITY_WINDOW_BUCKET_MS = 60 * 60 * 1000

const ACTIVITY_WINDOW_START = new Date(Math.floor(Date.now() / ACTIVITY_WINDOW_BUCKET_MS) * ACTIVITY_WINDOW_BUCKET_MS - ACTIVITY_WINDOW_MS).toISOString()

const CREATED_ACTIVITY_PAGINATION = { page: 1, pageSize: 50, query: { first: 50 } }

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
  records: T[] | undefined,
  type: string,
  listHref: string,
  labelFor: (record: T) => string,
  hrefFor: (record: T) => string,
) => {
  if (!records || records.length === 0) return

  if (records.length === 1) {
    const record = records[0]
    items.push({ id: record.id, label: labelFor(record), type, createdAt: record.createdAt ?? null, href: hrefFor(record) })
    return
  }

  const mostRecent = records.reduce((latest, record) => (activityTimestamp(record.createdAt) > activityTimestamp(latest.createdAt) ? record : latest))
  items.push({
    id: `group-${type}`,
    label: `${records.length} ${pluralizeLabel(toHumanLabel(type))}`,
    type,
    createdAt: mostRecent.createdAt ?? null,
    href: listHref,
    isGrouped: true,
  })
}

type VulnNode = { id: string; displayName?: string | null; displayID?: string | null; createdAt?: string | null; source?: string | null }

const vulnActivityItem = (v: VulnNode): ActivityItem => ({
  id: v.id,
  label: v.displayName ?? v.displayID ?? ObjectTypes.VULNERABILITY,
  type: ObjectTypes.VULNERABILITY,
  createdAt: v.createdAt ?? null,
  href: `/exposure/vulnerabilities?id=${v.id}`,
  source: v.source ?? null,
})

const pushVulnerabilityActivity = (items: ActivityItem[], vulns: VulnNode[] | undefined, groupBySource: boolean) => {
  if (!vulns || vulns.length === 0) return

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
      label: `${group.length} Vulnerabilities`,
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
  const activityWindowStart = ACTIVITY_WINDOW_START

  const { vulnerabilitiesNodes: recentVulns, isLoading: isLoadingVulns } = useVulnerabilitiesWithFilter({
    where: { open: true, createdAtGTE: activityWindowStart },
    orderBy: [{ field: VulnerabilityOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { findingsNodes: recentFindings, isLoading: isLoadingFindings } = useFindingsWithFilter({
    where: { open: true, createdAtGTE: activityWindowStart },
    orderBy: [{ field: FindingOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { risks: recentRisks, isLoading: isLoadingRisks } = useRisks({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], createdAtGTE: activityWindowStart },
    orderBy: [{ field: RiskOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { scansNodes: recentScans, isLoading: isLoadingScans } = useScansWithFilter({
    where: { createdAtGTE: activityWindowStart },
    orderBy: [{ field: ScanOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { reviewsNodes: recentReviews, isLoading: isLoadingReviews } = useReviewsWithFilter({
    where: { createdAtGTE: activityWindowStart },
    orderBy: [{ field: ReviewOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { policies: recentPolicies, isLoading: isLoadingPolicies } = useInternalPolicies({
    where: { createdAtGTE: activityWindowStart },
    orderBy: [{ field: InternalPolicyOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: CREATED_ACTIVITY_PAGINATION,
    enabled: includeNonExposureActivity,
  })

  const { controls: recentControls, isLoading: isLoadingControls } = useGetAllControls({
    where: { createdAtGTE: activityWindowStart, systemOwned: false, isTrustCenterControl: false },
    orderBy: [{ field: ControlOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: CREATED_ACTIVITY_PAGINATION,
    includeVars: { includeCreatedAt: true, includeTitle: true },
    enabled: includeNonExposureActivity,
  })

  const { notifications } = useNotificationsContext()
  const recentMentions = useMemo(
    () =>
      includeNonExposureActivity
        ? notifications.filter((notification) => notification.topic === NotificationNotificationTopic.MENTION && notification.createdAt && notification.createdAt >= activityWindowStart)
        : [],
    [notifications, includeNonExposureActivity, activityWindowStart],
  )

  const baseItems = useMemo(() => {
    const items: ActivityItem[] = []

    recentFindings?.forEach((f) =>
      items.push({ id: f.id, label: f.displayName ?? ObjectTypes.FINDING, type: ObjectTypes.FINDING, createdAt: f.createdAt, href: `/exposure/findings?id=${f.id}`, source: f.source ?? null }),
    )
    recentRisks?.forEach((r) => items.push({ id: r.id, label: r.name ?? ObjectTypes.RISK, type: ObjectTypes.RISK, createdAt: r.createdAt }))
    recentScans?.forEach((s) => items.push({ id: s.id, label: s.target ?? ObjectTypes.SCAN, type: ObjectTypes.SCAN, createdAt: s.createdAt }))
    recentReviews?.forEach((r) => items.push({ id: r.id, label: r.title ?? ObjectTypes.REVIEW, type: ObjectTypes.REVIEW, createdAt: r.createdAt }))
    recentMentions.forEach((notification) =>
      items.push({
        id: notification.id,
        label: notification.title,
        type: 'Mention',
        createdAt: notification.createdAt ?? null,
        href: getNotificationRedirectUrl(notification) ?? undefined,
      }),
    )

    return items
  }, [recentFindings, recentRisks, recentScans, recentReviews, recentMentions])

  const nonExposurePolicies = includeNonExposureActivity ? recentPolicies : undefined
  const nonExposureControls = includeNonExposureActivity ? recentControls : undefined

  const activityItems = useMemo(() => {
    const items = [...baseItems]
    pushVulnerabilityActivity(items, recentVulns, includeNonExposureActivity)
    pushCreatedActivity(items, nonExposurePolicies, ObjectTypes.INTERNAL_POLICY, '/policies', (p) => p.name ?? ObjectTypes.INTERNAL_POLICY, policyHref)
    pushCreatedActivity(items, nonExposureControls, ObjectTypes.CONTROL, '/controls', controlLabel, controlHref)
    return items.sort(byNewestFirst)
  }, [baseItems, recentVulns, nonExposurePolicies, nonExposureControls, includeNonExposureActivity])

  const allActivityItems = useMemo(() => {
    const items = [...baseItems]
    pushVulnerabilityActivity(items, recentVulns, false)
    nonExposurePolicies?.forEach((p) => items.push({ id: p.id, label: p.name ?? ObjectTypes.INTERNAL_POLICY, type: ObjectTypes.INTERNAL_POLICY, createdAt: p.createdAt ?? null, href: policyHref(p) }))
    nonExposureControls?.forEach((c) => items.push({ id: c.id, label: controlLabel(c), type: ObjectTypes.CONTROL, createdAt: c.createdAt ?? null, href: controlHref(c) }))
    return items.sort(byNewestFirst)
  }, [baseItems, recentVulns, nonExposurePolicies, nonExposureControls])

  const isLoading = isLoadingVulns || isLoadingFindings || isLoadingRisks || isLoadingScans || isLoadingReviews || (includeNonExposureActivity && (isLoadingPolicies || isLoadingControls))

  return { activityItems, allActivityItems, isLoading }
}
