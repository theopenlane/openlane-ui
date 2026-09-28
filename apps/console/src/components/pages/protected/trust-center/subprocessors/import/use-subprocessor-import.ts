'use client'

import { useCallback, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { resolveCountryCode } from '@repo/ui/country-list'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { buildMappedImport, type TImportPlan } from '@/components/shared/record-import/lib/build-mapped-import'
import { type TImportIssue, type TParsedDelimitedFile } from '@/components/shared/record-import/lib/types'
import { describeRows } from '@/components/shared/record-import/lib/validate-mapping'
import { type CustomTypeEnumOption, useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useCreateBulkSubprocessor, useSubprocessorCatalog } from '@/lib/graphql-hooks/subprocessor'
import { invalidateSubprocessorQueries, useCreateBulkTrustCenterSubprocessor, useTrustCenterSubprocessorLinks } from '@/lib/graphql-hooks/trust-center-subprocessor'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { chunk } from '@/utils/async'
import { companyNameKey } from '@/utils/company-name'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { formatList, objectToSnakeCase, pluralizeWithCount } from '@/utils/strings'
import {
  isActiveRow,
  parseSourceRows,
  resolveRows,
  ROW_PROBLEMS,
  toCreateSubprocessorInput,
  toCreateTrustCenterSubprocessorInput,
  type TCountryValueMap,
  type TImportDefaults,
  type TLinkedSubprocessors,
  type TResolvedRow,
  type TRowEdit,
  type TRowStatus,
} from './subprocessor-import-rows'
import { buildCatalogIndex, matchCatalogSubprocessor, type TCatalogSubprocessor } from './subprocessor-matching'

const BATCH_SIZE = 100
const EMPTY_DEFAULTS: TImportDefaults = { countries: [], category: '' }
const NO_EDITS: Readonly<Record<number, TRowEdit>> = {}
const NO_COUNTRY_MAPPINGS: TCountryValueMap = {}
const CATEGORY_KEY_SEPARATOR = '\u0000'

const rowIssue = (id: string, rows: TResolvedRow[], message: string): TImportIssue => ({
  id,
  message: `${describeRows(
    rows.map((row) => row.source.rowIndex),
    rows.length,
  )} ${message}`,
})

const unknownCategoriesKey = (rows: TResolvedRow[], known: ReadonlyMap<string, string>): string =>
  [...new Set(rows.map((row) => row.category).filter((category) => category && !known.has(category.toLowerCase())))].join(CATEGORY_KEY_SEPARATOR)

const splitCategoriesKey = (key: string): string[] => (key ? key.split(CATEGORY_KEY_SEPARATOR) : [])

type TEditsState = { plan: TImportPlan | null; edits: Readonly<Record<number, TRowEdit>> }

type TUseSubprocessorImportArgs = {
  parsed: TParsedDelimitedFile | null
  plan: TImportPlan
  enabled: boolean
}

export const useSubprocessorImport = ({ parsed, plan, enabled }: TUseSubprocessorImportArgs) => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const canCreateCategory = hasPermission(orgPermission?.roles, AccessEnum.CanCreateCustomTypeEnum, session)
  const canCreateSubprocessor = hasPermission(orgPermission?.roles, AccessEnum.CanCreateSubprocessor, session)

  const catalogQuery = useSubprocessorCatalog({ enabled })
  const linksQuery = useTrustCenterSubprocessorLinks({ enabled })
  const { enumOptions: categoryOptions } = useGetCustomTypeEnums({ where: { objectType: objectToSnakeCase(ObjectTypes.TRUST_CENTER_SUBPROCESSOR), field: 'kind' } })
  const { mutateAsync: createBulkSubprocessor } = useCreateBulkSubprocessor()
  const { mutateAsync: createBulkTrustCenterSubprocessor } = useCreateBulkTrustCenterSubprocessor()

  const [defaults, setDefaults] = useState<TImportDefaults>(EMPTY_DEFAULTS)
  const [countryValueMap, setCountryValueMap] = useState<TCountryValueMap>(NO_COUNTRY_MAPPINGS)
  const [createdIds, setCreatedIds] = useState<ReadonlyMap<string, string>>(() => new Map())
  const [editsState, setEditsState] = useState<TEditsState>({ plan: null, edits: NO_EDITS })
  const edits = editsState.plan === plan ? editsState.edits : NO_EDITS

  const updateRows = useCallback(
    (rowIndexes: number[], patch: TRowEdit) =>
      setEditsState((current) => {
        const next = { ...(current.plan === plan ? current.edits : NO_EDITS) }
        rowIndexes.forEach((rowIndex) => {
          next[rowIndex] = { ...next[rowIndex], ...patch }
        })
        return { plan, edits: next }
      }),
    [plan],
  )
  const updateRow = useCallback((rowIndex: number, patch: TRowEdit) => updateRows([rowIndex], patch), [updateRows])
  const mapCountryValue = useCallback((value: string, countries: string[]) => setCountryValueMap((current) => ({ ...current, [value]: countries })), [])

  const catalog = useMemo<TCatalogSubprocessor[]>(() => (catalogQuery.data ?? []).map(({ id, name, systemOwned }) => ({ id, name, systemOwned: Boolean(systemOwned) })), [catalogQuery.data])
  const catalogById = useMemo(() => new Map(catalog.map((subprocessor) => [subprocessor.id, subprocessor])), [catalog])
  const catalogIndex = useMemo(() => buildCatalogIndex(catalog), [catalog])
  const ownNames = useMemo(() => new Set(catalog.filter((subprocessor) => !subprocessor.systemOwned).map((subprocessor) => subprocessor.name)), [catalog])
  const knownCategories = useMemo(() => new Map(categoryOptions.map((option) => [option.value.toLowerCase(), option.value])), [categoryOptions])
  const linked = useMemo<TLinkedSubprocessors>(() => {
    const subprocessors = (linksQuery.data ?? []).flatMap((link) => (link.subprocessor ? [link.subprocessor] : []))
    return { ids: new Set(subprocessors.map(({ id }) => id)), nameKeys: new Set(subprocessors.map(({ name }) => companyNameKey(name))) }
  }, [linksQuery.data])

  const sourceRows = useMemo(() => (parsed ? parseSourceRows(buildMappedImport(parsed.fileName, parsed.rows, plan).toRecords()) : []), [parsed, plan])
  const autoMatches = useMemo(() => sourceRows.map((row) => (row.name ? matchCatalogSubprocessor(row.name, catalogIndex) : null)), [sourceRows, catalogIndex])
  const unrecognisedCountryValues = useMemo(
    () => [...new Set(sourceRows.flatMap((row) => row.countryValues).filter((value) => !resolveCountryCode(value)))].sort((a, b) => a.localeCompare(b)),
    [sourceRows],
  )

  const rows = useMemo(
    () => resolveRows({ sourceRows, autoMatches, catalogById, ownNames, linked, createdIds, knownCategories, countryValueMap, edits, defaults }),
    [sourceRows, autoMatches, catalogById, ownNames, linked, createdIds, knownCategories, countryValueMap, edits, defaults],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<TRowStatus, number> = { matched: 0, suggested: 0, new: 0, linked: 0, duplicate: 0, skipped: 0 }
    rows.forEach((row) => counts[row.status]++)
    return counts
  }, [rows])

  const activeRows = useMemo(() => rows.filter(isActiveRow), [rows])

  const newCategoriesKey = useMemo(() => unknownCategoriesKey(activeRows, knownCategories), [activeRows, knownCategories])
  const newCategories = useMemo(() => splitCategoriesKey(newCategoriesKey), [newCategoriesKey])
  const fileCategoriesKey = useMemo(() => unknownCategoriesKey(rows, knownCategories), [rows, knownCategories])
  const categorySelectOptions = useMemo<CustomTypeEnumOption[]>(
    () => [...categoryOptions, ...splitCategoriesKey(fileCategoriesKey).map((category) => ({ value: category, label: category }))],
    [categoryOptions, fileCategoriesKey],
  )

  const blockingIssues = useMemo(() => {
    const issues: TImportIssue[] = []

    if (activeRows.length === 0) issues.push({ id: 'nothing', message: 'No row would add a subprocessor to your Trust Center.' })
    if (statusCounts.suggested > 0) issues.push({ id: 'suggested', message: `Confirm or change ${pluralizeWithCount(statusCounts.suggested, 'suggested match', 'suggested matches')}.` })

    ROW_PROBLEMS.forEach((problem) => {
      const affected = activeRows.filter(problem.test)
      if (affected.length > 0) issues.push(rowIssue(problem.id, affected, problem.message))
    })

    if (!canCreateSubprocessor && statusCounts.new > 0) {
      issues.push(
        rowIssue(
          'create-permission',
          activeRows.filter((row) => row.status === 'new'),
          'no matching subprocessor, and you do not have permission to create custom subprocessors. Choose an existing subprocessor or skip those rows.',
        ),
      )
    }

    if (!canCreateCategory && newCategories.length > 0) {
      issues.push({
        id: 'new-categories',
        message: `You cannot create categories, and ${formatList(newCategories.map((category) => `"${category}"`))} ${newCategories.length === 1 ? 'does' : 'do'} not exist yet. Pick an existing category for those rows.`,
      })
    }

    return issues
  }, [activeRows, statusCounts, canCreateSubprocessor, canCreateCategory, newCategories])

  const confirmAllSuggestions = useCallback(
    () =>
      updateRows(
        rows.filter((row) => row.status === 'suggested').map((row) => row.source.rowIndex),
        { confirmed: true },
      ),
    [rows, updateRows],
  )

  const { refetch: refetchCatalog } = catalogQuery
  const { refetch: refetchLinks } = linksQuery
  const retry = useCallback(() => Promise.all([refetchCatalog(), refetchLinks()]), [refetchCatalog, refetchLinks])

  const runImport = useCallback(async () => {
    const toCreate = activeRows.filter((row) => row.status === 'new')
    const created = new Map(createdIds)

    try {
      for (const batch of chunk(toCreate, BATCH_SIZE)) {
        const result = await createBulkSubprocessor({ input: batch.map(toCreateSubprocessorInput) })
        const subprocessors = result.createBulkSubprocessor.subprocessors ?? []
        if (subprocessors.length !== batch.length) throw new UserFacingError('Some subprocessors could not be created. Please try again later.')
        batch.forEach((row, position) => created.set(row.source.nameKey, subprocessors[position].id))
        setCreatedIds(new Map(created))
      }

      const links = activeRows.flatMap((row) => {
        const subprocessorID = row.subprocessor?.id ?? created.get(row.source.nameKey)
        return subprocessorID ? [toCreateTrustCenterSubprocessorInput(row, subprocessorID)] : []
      })

      try {
        for (const batch of chunk(links, BATCH_SIZE)) {
          await createBulkTrustCenterSubprocessor({ input: batch })
        }
      } catch (error) {
        if (toCreate.length === 0) throw error
        throw new UserFacingError(
          `${pluralizeWithCount(toCreate.length, 'custom subprocessor')} ${toCreate.length === 1 ? 'was' : 'were'} created but not added to your Trust Center. Import again to add ${toCreate.length === 1 ? 'it' : 'them'}.`,
          { cause: error },
        )
      }

      return { created: toCreate.length, linked: links.length }
    } finally {
      invalidateSubprocessorQueries(
        queryClient,
        activeRows.map((row) => row.category),
      )
    }
  }, [activeRows, createdIds, createBulkSubprocessor, createBulkTrustCenterSubprocessor, queryClient])

  return {
    rows,
    activeCount: activeRows.length,
    statusCounts,
    catalog,
    categorySelectOptions,
    canCreateCategory,
    unrecognisedCountryValues,
    countryValueMap,
    mapCountryValue,
    defaults,
    setDefaults,
    updateRow,
    confirmAllSuggestions,
    blockingIssues,
    runImport,
    retry,
    isLoading: catalogQuery.isPending || linksQuery.isPending,
    isRefreshing: catalogQuery.isFetching || linksQuery.isFetching,
    isError: catalogQuery.isError || linksQuery.isError,
  }
}

export type TSubprocessorImportState = ReturnType<typeof useSubprocessorImport>
