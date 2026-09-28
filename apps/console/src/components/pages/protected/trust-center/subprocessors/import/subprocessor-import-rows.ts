import { resolveCountryCode } from '@repo/ui/country-list'
import { type CreateSubprocessorInput, type CreateTrustCenterSubprocessorInput } from '@repo/codegen/src/schema'
import { splitListCell } from '@/components/shared/record-import/lib/validate-cells'
import { type TImportRecord } from '@/components/shared/record-import/lib/types'
import { logoUrlFromDomain } from '@/lib/image-utils'
import { buildVendorLogoProxyUrl, toVendorLogoHost } from '@/lib/vendor-logo'
import { companyNameKey } from '@/utils/company-name'
import { normalizeHref } from '@/utils/normalizeUrl'
import { type TSubprocessorImportField } from './subprocessor-import-fields'
import { type TCatalogMatch, type TCatalogMatchConfidence, type TCatalogSubprocessor } from './subprocessor-matching'

export const CREATE_TARGET = '__create'
export const SKIP_TARGET = '__skip'

export type TCustomDetails = {
  website: string
  description: string
  tags: string[]
  logoRemoteURL: string
}

export type TSourceRow = {
  rowIndex: number
  name: string
  nameKey: string
  details: TCustomDetails
  countryValues: string[]
  category: string
}

export type TRowEdit = {
  target?: string
  confirmed?: boolean
  countries?: string[]
  category?: string
  details?: TCustomDetails
}

export type TImportDefaults = {
  countries: string[]
  category: string
}

export type TCountryValueMap = Readonly<Record<string, readonly string[]>>

export type TRowStatus = 'matched' | 'suggested' | 'new' | 'linked' | 'duplicate' | 'skipped'

export type TLogo = { state: 'none' } | { state: 'invalid' } | { state: 'ok'; url: string; previewHost: string | null }

export type TResolvedRow = {
  source: TSourceRow
  status: TRowStatus
  subprocessor: TCatalogSubprocessor | null
  matchConfidence: TCatalogMatchConfidence | 'manual' | null
  countries: string[]
  unresolvedCountries: string[]
  countriesFromDefault: boolean
  category: string
  categoryFromDefault: boolean
  details: TCustomDetails
  logo: TLogo
  nameTaken: boolean
}

const ACTIVE_STATUSES: ReadonlySet<TRowStatus> = new Set(['matched', 'suggested', 'new'])

export const isActiveRow = (row: TResolvedRow): boolean => ACTIVE_STATUSES.has(row.status)

const listCell = (value: string): string[] => splitListCell(value) ?? [value]

const countryCell = (value: string): string[] => (resolveCountryCode(value) ? [value] : listCell(value))

export const parseSourceRows = (records: TImportRecord[]): TSourceRow[] =>
  records.map((record, rowIndex) => {
    const read = (field: TSubprocessorImportField): string => record[field]?.trim() ?? ''
    const name = read('name')
    const tags = read('tags')
    const countries = read('countries')

    return {
      rowIndex,
      name,
      nameKey: companyNameKey(name),
      details: {
        website: read('website'),
        description: read('description'),
        tags: tags ? listCell(tags) : [],
        logoRemoteURL: read('logoRemoteURL'),
      },
      countryValues: countries ? countryCell(countries) : [],
      category: read('trustCenterSubprocessorKindName'),
    }
  })

const MAX_LOGO_URL_LENGTH = 2048

const isStorableLogoUrl = (url: string): boolean => {
  if (url.length > MAX_LOGO_URL_LENGTH) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.port === '' && Boolean(toVendorLogoHost(parsed.hostname))
  } catch {
    return false
  }
}

export const resolveLogo = ({ website, logoRemoteURL }: Pick<TCustomDetails, 'website' | 'logoRemoteURL'>): TLogo => {
  if (logoRemoteURL) {
    const url = normalizeHref(logoRemoteURL)
    return isStorableLogoUrl(url) ? { state: 'ok', url, previewHost: null } : { state: 'invalid' }
  }

  const host = website ? toVendorLogoHost(website) : null
  const url = host ? logoUrlFromDomain(host) : undefined
  return host && url ? { state: 'ok', url, previewHost: host } : { state: 'none' }
}

const LOGO_PREVIEW_SIZE = 64

export const logoPreviewUrl = (logo: TLogo): string | undefined => {
  if (logo.state !== 'ok') return undefined
  return logo.previewHost ? buildVendorLogoProxyUrl(logo.previewHost, LOGO_PREVIEW_SIZE) : logo.url
}

export type TLinkedSubprocessors = {
  ids: ReadonlySet<string>
  nameKeys: ReadonlySet<string>
}

type TResolveArgs = {
  sourceRows: TSourceRow[]
  autoMatches: readonly (TCatalogMatch | null)[]
  catalogById: ReadonlyMap<string, TCatalogSubprocessor>
  ownNames: ReadonlySet<string>
  linked: TLinkedSubprocessors
  createdIds: ReadonlyMap<string, string>
  knownCategories: ReadonlyMap<string, string>
  countryValueMap: TCountryValueMap
  edits: Readonly<Record<number, TRowEdit>>
  defaults: TImportDefaults
}

export const resolveRows = ({ sourceRows, autoMatches, catalogById, ownNames, linked, createdIds, knownCategories, countryValueMap, edits, defaults }: TResolveArgs): TResolvedRow[] => {
  const claimed = new Set<string>()
  const categories = new Map(knownCategories)

  const canonicalCategory = (value: string): string => {
    if (!value) return value
    const key = value.toLowerCase()
    const known = categories.get(key)
    if (known) return known
    categories.set(key, value)
    return value
  }

  return sourceRows.map((source): TResolvedRow => {
    const edit = edits[source.rowIndex] ?? {}
    const details = edit.details ?? source.details
    const countriesFromCsv = source.countryValues.map((value) => {
      const code = resolveCountryCode(value)
      return { value, codes: code ? [code] : (countryValueMap[value] ?? []) }
    })
    const countriesFromDefault = !edit.countries && countriesFromCsv.length === 0
    const countries = edit.countries ?? (countriesFromDefault ? defaults.countries : countriesFromCsv.flatMap(({ codes }) => codes))
    const categoryFromDefault = edit.category === undefined && !source.category
    const base = {
      source,
      countries: [...new Set(countries)],
      unresolvedCountries: edit.countries ? [] : countriesFromCsv.flatMap(({ value, codes }) => (codes.length > 0 ? [] : [value])),
      countriesFromDefault,
      category: canonicalCategory(edit.category ?? (source.category || defaults.category)),
      categoryFromDefault,
      details,
      logo: resolveLogo(details),
      nameTaken: false,
    }

    if (!source.name || edit.target === SKIP_TARGET) return { ...base, status: 'skipped', subprocessor: null, matchConfidence: null }

    const isExplicitCreate = edit.target === CREATE_TARGET
    const createdId = createdIds.get(source.nameKey)
    const autoMatch = edit.target === undefined ? autoMatches[source.rowIndex] : null
    const chosen = edit.target && !isExplicitCreate ? (catalogById.get(edit.target) ?? null) : null
    const previouslyCreated = !chosen && !autoMatch && createdId ? { id: createdId, name: source.name, systemOwned: false } : null
    const subprocessor = chosen ?? autoMatch?.subprocessor ?? previouslyCreated
    const matchConfidence = chosen || previouslyCreated ? 'manual' : (autoMatch?.confidence ?? null)

    if (matchConfidence === 'suggested' && !edit.confirmed) return { ...base, status: 'suggested', subprocessor, matchConfidence }

    const isLinked = subprocessor ? linked.ids.has(subprocessor.id) : !isExplicitCreate && linked.nameKeys.has(source.nameKey)
    if (isLinked) return { ...base, status: 'linked', subprocessor, matchConfidence }

    const claimKey = subprocessor ? subprocessor.id : `new:${source.nameKey}`
    if (claimed.has(claimKey)) return { ...base, status: 'duplicate', subprocessor, matchConfidence }
    claimed.add(claimKey)

    if (!subprocessor) return { ...base, status: 'new', subprocessor: null, matchConfidence: null, nameTaken: ownNames.has(source.name.trim()) }

    return { ...base, status: 'matched', subprocessor, matchConfidence }
  })
}

export const toCreateSubprocessorInput = (row: TResolvedRow): CreateSubprocessorInput => ({
  name: row.source.name.trim(),
  ...(row.details.description ? { description: row.details.description } : {}),
  ...(row.details.tags.length > 0 ? { tags: row.details.tags } : {}),
  ...(row.logo.state === 'ok' ? { logoRemoteURL: row.logo.url } : {}),
})

export const toCreateTrustCenterSubprocessorInput = (row: TResolvedRow, subprocessorID: string): CreateTrustCenterSubprocessorInput => ({
  subprocessorID,
  countries: row.countries,
  trustCenterSubprocessorKindName: row.category,
})

export type TRowProblem = {
  id: string
  test: (row: TResolvedRow) => boolean
  message: string
}

export const ROW_PROBLEMS: readonly TRowProblem[] = [
  {
    id: 'unresolved-countries',
    test: (row) => row.unresolvedCountries.length > 0,
    message: 'a country that is not recognised. Map it under "Unrecognised countries" or set the countries per row.',
  },
  {
    id: 'countries',
    test: (row) => row.countries.length === 0 && row.unresolvedCountries.length === 0,
    message: 'no country. Choose default countries or set them per row.',
  },
  {
    id: 'category',
    test: (row) => !row.category,
    message: 'no category. Choose a default category or set one per row.',
  },
  {
    id: 'logo',
    test: (row) => row.status === 'new' && row.logo.state === 'invalid',
    message: 'a logo URL that is not a valid https address. Fix it in the row details.',
  },
  {
    id: 'name-taken',
    test: (row) => row.nameTaken,
    message: 'the name of one of your custom subprocessors. Choose that subprocessor instead of creating a new one.',
  },
]

export const needsReview = (row: TResolvedRow): boolean => row.status === 'suggested' || (isActiveRow(row) && ROW_PROBLEMS.some((problem) => problem.test(row)))
