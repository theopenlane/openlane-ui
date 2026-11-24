import { addYears, subYears } from 'date-fns'
import { type TAssetDialog } from '../../asset-quick-actions'
import { type AssetDetailNode } from '../../../asset-display'
import { READINESS_REVIEW_YEARS, READINESS_SCAN_DAYS, type AssetVendorNode } from '@/lib/graphql-hooks/asset-detail'
import { type GetAssetReadinessEvidenceQuery, type GetAssetReadinessReviewsQuery, type GetAssetReadinessScansQuery } from '@repo/codegen/src/schema'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { formatDate } from '@/utils/date'
import { formatList, formatTruncatedList, pluralizeWithCount } from '@/utils/strings'
import { isExposurePastDue, type TExposureItem } from '../exposure/exposure-items'

export type TReadinessAction = Exclude<TAssetDialog, 'link-exposure'> | 'edit' | 'view-exposure' | 'view-vendor'

export type TReadinessCheck = {
  key: string
  group: 'inventory' | 'operating'
  label: string
  state: 'ready' | 'attention' | 'unavailable'
  detail: string
  action?: { type: TReadinessAction; label: string }
}

export type TReadinessSource<TData> = { hasAccess: boolean; isError: boolean; data: TData | undefined }

type TReadinessSources = {
  asset: AssetDetailNode
  ownerLabel: string | null
  exposure: TReadinessSource<TExposureItem[]>
  vendors: TReadinessSource<AssetVendorNode[]>
  reviews: TReadinessSource<GetAssetReadinessReviewsQuery>
  scans: TReadinessSource<GetAssetReadinessScansQuery>
  evidence: TReadinessSource<GetAssetReadinessEvidenceQuery>
  now: Date
}

const stateFor = (passed: boolean) => (passed ? 'ready' : 'attention')

type TReadinessCheckBase = Pick<TReadinessCheck, 'key' | 'group' | 'label'>

const fromSource = <TData>(base: TReadinessCheckBase, source: TReadinessSource<TData>, build: (data: TData) => Omit<TReadinessCheck, keyof TReadinessCheckBase>): TReadinessCheck[] => {
  if (!source.hasAccess) return []
  if (source.data === undefined) return source.isError ? [{ ...base, state: 'unavailable', detail: 'Could not be checked' }] : []
  return [{ ...base, ...build(source.data) }]
}

const EDIT_ACTION = { type: 'edit', label: 'Edit' } as const

const latestBy = <T>(items: T[], date: (item: T) => string | null | undefined): { item: T; at: Date } | null =>
  items.reduce<{ item: T; at: Date } | null>((latest, item) => {
    const value = date(item)
    if (!value) return latest
    const at = new Date(value)
    return !latest || at > latest.at ? { item, at } : latest
  }, null)

const format = (date: Date) => formatDate(date.toISOString())

const missingFieldsCheck = (key: string, label: string, fields: { label: string; value: string | null | undefined }[]): TReadinessCheck => {
  const missing = fields.filter(({ value }) => !value?.trim()).map((field) => field.label)
  return {
    key,
    group: 'inventory',
    label,
    state: stateFor(missing.length === 0),
    detail: missing.length === 0 ? fields.map(({ value }) => value).join(', ') : `Missing ${formatList(missing, 'conjunction')}`,
    action: missing.length === 0 ? undefined : EDIT_ACTION,
  }
}

const INVENTORY_VERIFIED: TReadinessCheckBase = { key: 'inventory-verified', group: 'inventory', label: 'Inventory verified' }

const inventoryVerified = (asset: AssetDetailNode, reviews: GetAssetReadinessReviewsQuery | undefined, now: Date): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const review = latestBy(getNodes(reviews?.assetReviews), (node) => node.reviewedAt)
  const observed = asset.observedAt ? new Date(asset.observedAt) : null
  const verifiedAt = review && (!observed || review.at > observed) ? review.at : observed
  const passed = !!verifiedAt && verifiedAt > subYears(now, READINESS_REVIEW_YEARS)
  return {
    state: stateFor(passed),
    detail: passed && verifiedAt ? `Last verified ${format(verifiedAt)} · next due ${format(addYears(verifiedAt, READINESS_REVIEW_YEARS))}` : 'Not reviewed in the last year',
    action: passed ? undefined : { type: 'mark-reviewed', label: 'Mark Reviewed' },
  }
}

const inventoryVerifiedChecks = (asset: AssetDetailNode, reviews: TReadinessSource<GetAssetReadinessReviewsQuery>, now: Date): TReadinessCheck[] => {
  if (asset.observedAt || reviews.data) return [{ ...INVENTORY_VERIFIED, ...inventoryVerified(asset, reviews.data, now) }]
  return fromSource(INVENTORY_VERIFIED, reviews, (data) => inventoryVerified(asset, data, now))
}

const accessReviewed = (reviews: GetAssetReadinessReviewsQuery): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const review = latestBy(getNodes(reviews.accessReviews), (node) => node.reviewedAt)
  return {
    state: stateFor(!!review),
    detail: review ? `${review.item.title} completed ${format(review.at)}` : 'No access review in the last year',
    action: review ? undefined : { type: 'add-review', label: 'Add Review' },
  }
}

const scanned = (scans: GetAssetReadinessScansQuery): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const scan = latestBy(getNodes(scans.scans), (node) => node.scanDate ?? node.createdAt)
  return { state: stateFor(!!scan), detail: scan ? `Last scan ${format(scan.at)}` : `No vulnerability scan in the last ${READINESS_SCAN_DAYS} days` }
}

const exposureWithinSla = (exposure: TExposureItem[]): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const open = exposure.filter((item) => item.isOpen)
  const pastDue = open.filter(isExposurePastDue)
  const nextDue = open.flatMap((item) => (item.dueDate && !isExposurePastDue(item) ? [item.dueDate] : [])).sort((a, b) => a.getTime() - b.getTime())[0]
  const nextDueLabel = nextDue ? ` · next due ${format(nextDue)}` : ''
  return {
    state: stateFor(pastDue.length === 0),
    detail: pastDue.length > 0 ? `${pastDue.length} of ${open.length} open past due` : open.length > 0 ? `${open.length} open, none past due${nextDueLabel}` : 'No open exposure',
    action: pastDue.length > 0 ? { type: 'view-exposure', label: 'View' } : undefined,
  }
}

type TRefCodeConnection = GetAssetReadinessEvidenceQuery['missingControls']

const refCodes = (...connections: TRefCodeConnection[]) => {
  const codes = connections.flatMap((connection) => getNodes(connection).map(({ refCode }) => refCode))
  const total = connections.reduce((sum, { totalCount }) => sum + totalCount, 0)
  return { total, label: formatTruncatedList(codes, total, codes.length) }
}

const evidenceCurrent = (evidence: GetAssetReadinessEvidenceQuery): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const linkedCount = evidence.linkedControls.totalCount + evidence.linkedSubcontrols.totalCount
  if (linkedCount === 0) return { state: 'attention', detail: 'No controls mapped', action: { type: 'map-control', label: 'Map Control' } }
  const missing = refCodes(evidence.missingControls, evidence.missingSubcontrols)
  const stale = refCodes(evidence.staleControls, evidence.staleSubcontrols)
  const problems = [...(missing.total > 0 ? [`${missing.label} without approved evidence`] : []), ...(stale.total > 0 ? [`${stale.label} due for renewal`] : [])]
  return {
    state: stateFor(problems.length === 0),
    detail: problems.length > 0 ? problems.join(' · ') : `${pluralizeWithCount(linkedCount, 'control')} with approved evidence`,
    action: problems.length > 0 ? { type: 'upload-evidence', label: 'Upload' } : undefined,
  }
}

const providerAssured = (vendors: AssetVendorNode[], now: Date): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const problems = vendors.flatMap((vendor) => {
    const name = vendorDisplayName(vendor)
    if (!vendor.hasSoc2) return [`${name} has no SOC 2 on file`]
    if (!vendor.soc2PeriodEnd) return [`${name} SOC 2 has no period end`]
    const periodEnd = new Date(vendor.soc2PeriodEnd)
    return addYears(periodEnd, 1) < now ? [`${name} SOC 2 period ended ${format(periodEnd)}`] : []
  })
  return {
    state: stateFor(problems.length === 0),
    detail: problems.length > 0 ? problems.join(' · ') : `${formatList(vendors.map(vendorDisplayName), 'conjunction')} SOC 2 current`,
    action: problems.length > 0 ? { type: 'view-vendor', label: 'View Vendor' } : undefined,
  }
}

export const buildReadinessChecks = ({ asset, ownerLabel, exposure, vendors, reviews, scans, evidence, now }: TReadinessSources): TReadinessCheck[] => [
  {
    key: 'owner',
    group: 'inventory',
    label: 'Owner assigned',
    state: stateFor(!!ownerLabel),
    detail: ownerLabel ?? 'No owner',
    action: ownerLabel ? undefined : EDIT_ACTION,
  },
  missingFieldsCheck('classified', 'Classified and protected', [
    { label: 'data classification', value: asset.assetDataClassificationName },
    { label: 'security tier', value: asset.securityTierName },
    { label: 'encryption status', value: asset.encryptionStatusName },
    { label: 'access model', value: asset.accessModelName },
  ]),
  missingFieldsCheck('environment-scope', 'Environment and scope set', [
    { label: 'environment', value: asset.environmentName },
    { label: 'scope', value: asset.scopeName },
  ]),
  ...inventoryVerifiedChecks(asset, reviews, now),
  ...fromSource({ key: 'access-reviewed', group: 'operating', label: 'Access reviewed' }, reviews, accessReviewed),
  ...fromSource({ key: 'scanning', group: 'operating', label: 'Vulnerability scanning' }, scans, scanned),
  ...fromSource({ key: 'exposure-sla', group: 'operating', label: 'Exposure within SLA' }, exposure, exposureWithinSla),
  ...fromSource({ key: 'evidence', group: 'operating', label: 'Evidence current' }, evidence, evidenceCurrent),
  ...(vendors.data?.length === 0 ? [] : fromSource({ key: 'provider-assurance', group: 'operating', label: 'Provider assurance' }, vendors, (data) => providerAssured(data, now))),
]
