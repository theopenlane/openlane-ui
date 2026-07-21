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

const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

// policies/controls are grouped for the compact preview, so this needs enough of them fetched
// for both that group count and the ungrouped "see all" list to be accurate
const CREATED_ACTIVITY_PAGINATION = { page: 1, pageSize: 50, query: { first: 50 } }

export type ActivityItem = {
  id: string
  label: string
  type: string
  createdAt: string
  href?: string
  source?: string | null
}

const pluralizeLabel = (label: string): string => {
  if (/[bcdfghjklmnpqrstvwxyz]y$/i.test(label)) return `${label.slice(0, -1)}ies`
  if (/(?:s|x|z|ch|sh)$/i.test(label)) return `${label}es`
  return `${label}s`
}

// a single created-by-a-person record shows its own name; a pile of them (e.g. a bulk import)
// collapses into one "N Controls created" row instead of flooding the feed with every record
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
    items.push({ id: record.id, label: labelFor(record), type, createdAt: record.createdAt as string, href: hrefFor(record) })
    return
  }

  const mostRecent = records.reduce((latest, record) => ((record.createdAt ?? '') > (latest.createdAt ?? '') ? record : latest))
  items.push({ id: `group-${type}`, label: `${records.length} ${pluralizeLabel(toHumanLabel(type))}`, type, createdAt: mostRecent.createdAt as string, href: listHref })
}

type VulnNode = { id: string; displayName?: string | null; displayID?: string | null; createdAt?: string | null; source?: string | null }

const vulnActivityItem = (v: VulnNode): ActivityItem => ({
  id: v.id,
  label: v.displayName ?? v.displayID ?? ObjectTypes.VULNERABILITY,
  type: ObjectTypes.VULNERABILITY,
  createdAt: v.createdAt as string,
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

    const mostRecent = group.reduce((latest, v) => ((v.createdAt ?? '') > (latest.createdAt ?? '') ? v : latest))
    items.push({
      id: `group-${ObjectTypes.VULNERABILITY}-${source || 'unknown'}`,
      label: `${group.length} Vulnerabilities`,
      type: ObjectTypes.VULNERABILITY,
      createdAt: mostRecent.createdAt as string,
      href: '/exposure/vulnerabilities',
      source: source || null,
    })
  })
}

type ControlNode = { id: string; refCode?: string | null; title?: string | null; createdAt?: string | null }
type PolicyNode = { id: string; name?: string | null; createdAt?: string | null }

const controlLabel = (c: ControlNode) => (c.title ? `${c.refCode} — ${c.title}` : (c.refCode ?? ObjectTypes.CONTROL))
const controlHref = (c: ControlNode) => `/controls/${c.id}`
const policyHref = (p: PolicyNode) => `/policies/${p.id}/view`

export const useRecentActivityItems = ({ includeNonExposureActivity = true }: { includeNonExposureActivity?: boolean } = {}) => {
  const { vulnerabilitiesNodes: recentVulns, isLoading: isLoadingVulns } = useVulnerabilitiesWithFilter({
    where: { open: true, createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: VulnerabilityOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { findingsNodes: recentFindings, isLoading: isLoadingFindings } = useFindingsWithFilter({
    where: { open: true, createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: FindingOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { risks: recentRisks, isLoading: isLoadingRisks } = useRisks({
    where: { statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED], createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: RiskOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { scansNodes: recentScans, isLoading: isLoadingScans } = useScansWithFilter({
    where: { createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: ScanOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { reviewsNodes: recentReviews, isLoading: isLoadingReviews } = useReviewsWithFilter({
    where: { createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: ReviewOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: DEFAULT_PAGINATION,
  })

  const { policies: recentPolicies, isLoading: isLoadingPolicies } = useInternalPolicies({
    where: { createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: InternalPolicyOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: CREATED_ACTIVITY_PAGINATION,
    enabled: includeNonExposureActivity,
  })

  const { controls: recentControls, isLoading: isLoadingControls } = useGetAllControls({
    where: { createdAtGTE: thirtyDaysAgo },
    orderBy: [{ field: ControlOrderField.created_at, direction: OrderDirection.DESC }],
    pagination: CREATED_ACTIVITY_PAGINATION,
    includeVars: { includeCreatedAt: true, includeTitle: true },
    enabled: includeNonExposureActivity,
  })

  const { notifications } = useNotificationsContext()
  const recentMentions = useMemo(
    () =>
      includeNonExposureActivity
        ? notifications.filter((notification) => notification.topic === NotificationNotificationTopic.MENTION && notification.createdAt && notification.createdAt >= thirtyDaysAgo)
        : [],
    [notifications, includeNonExposureActivity],
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
        createdAt: notification.createdAt as string,
        href: getNotificationRedirectUrl(notification) ?? undefined,
      }),
    )

    return items
  }, [recentFindings, recentRisks, recentScans, recentReviews, recentMentions])

  const activityItems = useMemo(() => {
    const items = [...baseItems]
    pushVulnerabilityActivity(items, recentVulns, includeNonExposureActivity)
    pushCreatedActivity(items, recentPolicies, ObjectTypes.INTERNAL_POLICY, '/policies', (p) => p.name ?? ObjectTypes.INTERNAL_POLICY, policyHref)
    pushCreatedActivity(items, recentControls, ObjectTypes.CONTROL, '/controls', controlLabel, controlHref)
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [baseItems, recentVulns, recentPolicies, recentControls, includeNonExposureActivity])

  const allActivityItems = useMemo(() => {
    const items = [...baseItems]
    pushVulnerabilityActivity(items, recentVulns, false)
    recentPolicies?.forEach((p) => items.push({ id: p.id, label: p.name ?? ObjectTypes.INTERNAL_POLICY, type: ObjectTypes.INTERNAL_POLICY, createdAt: p.createdAt as string, href: policyHref(p) }))
    recentControls?.forEach((c) => items.push({ id: c.id, label: controlLabel(c), type: ObjectTypes.CONTROL, createdAt: c.createdAt as string, href: controlHref(c) }))
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [baseItems, recentVulns, recentPolicies, recentControls])

  const isLoading = isLoadingVulns || isLoadingFindings || isLoadingRisks || isLoadingScans || isLoadingReviews || isLoadingPolicies || isLoadingControls

  return { activityItems, allActivityItems, isLoading }
}
