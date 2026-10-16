import { type CreateTrustCenterSubprocessorInput, type EntityWhereInput } from '@repo/codegen/src/schema'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type TVendorSubprocessorCandidate } from '@/lib/graphql-hooks/subprocessor'
import {
  matchVendorCategory,
  needsVendorLink,
  resolveVendorSubprocessorTarget,
  type TSubprocessorRef,
  type TVendorSubprocessorTarget,
  vendorSubprocessorName,
} from '@/components/pages/protected/trust-center/shared/vendor-subprocessor'
import { subprocessorNameKey } from '@/components/pages/protected/trust-center/subprocessors/import/subprocessor-matching'
import { type TSubprocessorListingDefaults } from '@/components/pages/protected/trust-center/shared/subprocessor-listing-defaults'

export type TListingEdit = { countries?: string[]; category?: string }

export type TRunSubprocessor = TSubprocessorRef & { linked: boolean }

type TCatalogNode = TSubprocessorRef & { systemOwned?: boolean | null; createdAt?: string | null }

type TSubprocessorIndex = {
  listedIds: ReadonlySet<string>
  listedByName: ReadonlyMap<string, TSubprocessorRef>
  ownByName: ReadonlyMap<string, TSubprocessorRef>
  catalogByName: ReadonlyMap<string, TSubprocessorRef>
}

type TRowProblems = Partial<Record<'subprocessor' | 'countries' | 'category', string>>

export type TVendorRow = {
  vendor: TVendorSubprocessorCandidate
  target: TVendorSubprocessorTarget
  selected: boolean
  linkVendor: boolean
  linkAccessPending: boolean
  linkSkipped: boolean
  countries: string[]
  category: string
  categoryFromVendor: boolean
  problems: TRowProblems
}

const byOldest = (a: TCatalogNode, b: TCatalogNode): number => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')

const firstByName = (subprocessors: readonly TSubprocessorRef[]): Map<string, TSubprocessorRef> => {
  const byName = new Map<string, TSubprocessorRef>()
  subprocessors.forEach(({ id, name }) => {
    if (!byName.has(subprocessorNameKey(name))) byName.set(subprocessorNameKey(name), { id, name })
  })
  return byName
}

export const buildSubprocessorIndex = (catalog: readonly TCatalogNode[], listedSubprocessors: readonly TSubprocessorRef[], acknowledgedListedIds: ReadonlySet<string>): TSubprocessorIndex => {
  const oldestFirst = [...catalog].sort(byOldest)

  return {
    listedIds: new Set([...listedSubprocessors.map(({ id }) => id), ...acknowledgedListedIds]),
    listedByName: firstByName(listedSubprocessors),
    ownByName: firstByName(oldestFirst.filter(({ systemOwned }) => !systemOwned)),
    catalogByName: firstByName(oldestFirst.filter(({ systemOwned }) => systemOwned)),
  }
}

const vendorNamedWhere = (name: string): EntityWhereInput => ({
  or: [
    { displayNameNotNil: true, displayNameEqualFold: name },
    { displayNameIsNil: true, nameNotNil: true, nameEqualFold: name },
  ],
})

export const notListedVendorWhere = (listed: readonly TSubprocessorRef[]): EntityWhereInput | undefined =>
  listed.length === 0 ? undefined : { not: { or: [{ hasSubprocessorsWith: [{ idIn: listed.map(({ id }) => id) }] }, ...[...firstByName(listed).values()].map(({ name }) => vendorNamedWhere(name))] } }

const resolveVendorTarget = (vendor: TVendorSubprocessorCandidate, index: TSubprocessorIndex, runResult?: TRunSubprocessor): TVendorSubprocessorTarget => {
  const key = subprocessorNameKey(vendorSubprocessorName(vendor))
  const runRef = runResult && { id: runResult.id, name: runResult.name }
  const linked = getNodes(vendor.subprocessors)
  const ownSameName = runResult && !runResult.linked ? runRef : index.ownByName.get(key)
  const catalogSameName = index.catalogByName.get(key)
  const candidates = [...linked, runRef, ownSameName, catalogSameName].filter((subprocessor): subprocessor is TSubprocessorRef => !!subprocessor)

  return resolveVendorSubprocessorTarget({
    listed: candidates.find(({ id }) => index.listedIds.has(id)) ?? index.listedByName.get(key),
    linked: runResult?.linked ? runRef : linked[0],
    ownSameName,
    catalogSameName,
  })
}

const targetKey = (target: Exclude<TVendorSubprocessorTarget, { kind: 'listed' }>, vendor: TVendorSubprocessorCandidate): string =>
  target.kind === 'new' ? `new:${subprocessorNameKey(vendorSubprocessorName(vendor))}` : target.subprocessor.id

export type TRowContext = {
  selectedIds: ReadonlySet<string>
  index: TSubprocessorIndex
  runResults: ReadonlyMap<string, TRunSubprocessor>
  canLinkVendor: (vendorId: string) => boolean | undefined
  edits: Readonly<Record<string, TListingEdit>>
  defaults: TSubprocessorListingDefaults
  categoryOptions: CustomTypeEnumOption[]
  canCreateSubprocessor: boolean
}

export const resolveVendorRow = (vendor: TVendorSubprocessorCandidate, context: TRowContext): TVendorRow => {
  const target = resolveVendorTarget(vendor, context.index, context.runResults.get(vendor.id))
  const selected = context.selectedIds.has(vendor.id) && target.kind !== 'listed'
  const wantsLink = target.kind === 'new' || needsVendorLink(target)
  const linkAccess = wantsLink ? context.canLinkVendor(vendor.id) : false
  const edit = context.edits[vendor.id] ?? {}
  const vendorCategory = matchVendorCategory(vendor, context.categoryOptions)
  const category = edit.category ?? (vendorCategory || context.defaults.category)
  const countries = edit.countries ?? context.defaults.countries

  const problems: TRowProblems = {}
  if (selected) {
    if (target.kind === 'new' && !context.canCreateSubprocessor) problems.subprocessor = 'You do not have permission to create subprocessors.'
    if (countries.length === 0) problems.countries = 'Select at least one country.'
    if (!category) problems.category = 'Select a category.'
  }

  return {
    vendor,
    target,
    selected,
    linkVendor: linkAccess === true,
    linkAccessPending: selected && linkAccess === undefined,
    linkSkipped: selected && linkAccess === false && wantsLink,
    countries,
    category,
    categoryFromVendor: edit.category === undefined && !!vendorCategory,
    problems,
  }
}

export const withDuplicateProblems = (rows: readonly TVendorRow[]): TVendorRow[] => {
  const claimedBy = new Map<string, TVendorRow>()
  return rows.map((row) => {
    if (!row.selected || row.target.kind === 'listed') return row
    const key = targetKey(row.target, row.vendor)
    const claimant = claimedBy.get(key)
    if (!claimant) {
      claimedBy.set(key, row)
      return row
    }
    return { ...row, problems: { ...row.problems, subprocessor: `${vendorSubprocessorName(claimant.vendor)} already adds this subprocessor.` } }
  })
}

export const toListingInput = (row: TVendorRow, subprocessorID: string): CreateTrustCenterSubprocessorInput => ({
  subprocessorID,
  countries: row.countries,
  trustCenterSubprocessorKindName: row.category,
})
