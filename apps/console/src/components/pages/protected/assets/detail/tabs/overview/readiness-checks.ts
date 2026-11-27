import { addYears, subYears } from 'date-fns'
import { type TAssetDialog } from '../../asset-quick-actions'
import { type TAssetFieldsDialog } from '../../set-asset-fields-dialog'
import { type AssetDetailNode } from '../../../asset-display'
import { READINESS_REVIEW_YEARS, type AssetVendorNode } from '@/lib/graphql-hooks/asset-detail'
import { type GetAssetReadinessReviewsQuery } from '@repo/codegen/src/schema'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { formatDate } from '@/utils/date'
import { formatList } from '@/utils/strings'
import { isExposurePastDue, type TExposureItem } from '../exposure/exposure-items'

export type TReadinessAction = Extract<TAssetDialog, 'mark-reviewed' | TAssetFieldsDialog> | 'view-exposure' | 'view-vendor'

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
  now: Date
}

const stateFor = (passed: boolean) => (passed ? 'ready' : 'attention')

type TReadinessCheckBase = Pick<TReadinessCheck, 'key' | 'group' | 'label'>

const fromSource = <TData>(base: TReadinessCheckBase, source: TReadinessSource<TData>, build: (data: TData) => Omit<TReadinessCheck, keyof TReadinessCheckBase>): TReadinessCheck[] => {
  if (!source.hasAccess) return []
  if (source.data === undefined) return source.isError ? [{ ...base, state: 'unavailable', detail: 'Could not be checked' }] : []
  return [{ ...base, ...build(source.data) }]
}

const latestBy = <T>(items: T[], date: (item: T) => string | null | undefined): { item: T; at: Date } | null =>
  items.reduce<{ item: T; at: Date } | null>((latest, item) => {
    const value = date(item)
    if (!value) return latest
    const at = new Date(value)
    return !latest || at > latest.at ? { item, at } : latest
  }, null)

const format = (date: Date) => formatDate(date.toISOString())

const missingFieldsCheck = (key: string, label: string, action: TReadinessAction, fields: { label: string; value: string | null | undefined }[]): TReadinessCheck => {
  const missing = fields.filter(({ value }) => !value?.trim()).map((field) => field.label)
  return {
    key,
    group: 'inventory',
    label,
    state: stateFor(missing.length === 0),
    detail: missing.length === 0 ? fields.map(({ value }) => value).join(', ') : `Missing ${formatList(missing, 'conjunction')}`,
    action: missing.length === 0 ? undefined : { type: action, label: 'Set' },
  }
}

const INVENTORY_VERIFIED: TReadinessCheckBase = { key: 'inventory-verified', group: 'inventory', label: 'Inventory verified' }

const inventoryVerified = (asset: AssetDetailNode, reviews: GetAssetReadinessReviewsQuery | undefined, now: Date): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const review = latestBy(getNodes(reviews?.reviews), (node) => node.reviewedAt)
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

const providerAssured = (vendors: AssetVendorNode[], now: Date): Omit<TReadinessCheck, keyof TReadinessCheckBase> => {
  const reviewedSince = subYears(now, READINESS_REVIEW_YEARS)
  const problems = vendors
    .filter(({ hasSoc2, lastReviewedAt }) => !hasSoc2 && !(lastReviewedAt && new Date(lastReviewedAt) > reviewedSince))
    .map((vendor) => `${vendorDisplayName(vendor)} has no SOC 2 on file or review in the last year`)
  return {
    state: stateFor(problems.length === 0),
    detail: problems.length > 0 ? problems.join(' · ') : `${formatList(vendors.map(vendorDisplayName), 'conjunction')} assured by SOC 2 or a review in the last year`,
    action: problems.length > 0 ? { type: 'view-vendor', label: 'View Vendor' } : undefined,
  }
}

export const buildReadinessChecks = ({ asset, ownerLabel, exposure, vendors, reviews, now }: TReadinessSources): TReadinessCheck[] => [
  {
    key: 'owner',
    group: 'inventory',
    label: 'Owner assigned',
    state: stateFor(!!ownerLabel),
    detail: ownerLabel ?? 'No owner',
    action: ownerLabel ? undefined : { type: 'set-owner', label: 'Set' },
  },
  missingFieldsCheck('classified', 'Classified and protected', 'set-classification', [
    { label: 'data classification', value: asset.assetDataClassificationName },
    { label: 'security tier', value: asset.securityTierName },
    { label: 'encryption status', value: asset.encryptionStatusName },
    { label: 'access model', value: asset.accessModelName },
  ]),
  missingFieldsCheck('environment-scope', 'Environment and scope set', 'set-environment-scope', [
    { label: 'environment', value: asset.environmentName },
    { label: 'scope', value: asset.scopeName },
  ]),
  ...inventoryVerifiedChecks(asset, reviews, now),
  ...fromSource({ key: 'exposure-sla', group: 'operating', label: 'Exposure within SLA' }, exposure, exposureWithinSla),
  ...(vendors.data?.length === 0 ? [] : fromSource({ key: 'provider-assurance', group: 'operating', label: 'Provider assurance' }, vendors, (data) => providerAssured(data, now))),
]
