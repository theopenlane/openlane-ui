'use client'

import { useCallback, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { splitCategoriesKey, SUBPROCESSOR_CATEGORY_WHERE, toCategoriesKey, withChosenCategoryOptions } from '@/components/pages/protected/trust-center/shared/category-options'
import { type TSubprocessorListingDefaults } from '@/components/pages/protected/trust-center/shared/subprocessor-listing-defaults'
import { toVendorSubprocessorVariables, vendorSubprocessorName } from '@/components/pages/protected/trust-center/shared/vendor-subprocessor'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { type TVendorSubprocessorCandidate, useCreateSubprocessor, useSubprocessorCatalog, useUpdateSubprocessor } from '@/lib/graphql-hooks/subprocessor'
import { invalidateSubprocessorQueries, useCreateBulkTrustCenterSubprocessor, useTrustCenterSubprocessorLinks } from '@/lib/graphql-hooks/trust-center-subprocessor'
import { useAccountRolesMany, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { chunk, mapWithConcurrency } from '@/utils/async'
import { parseErrorMessage, UserFacingError } from '@/utils/graphQlErrorMatcher'
import { formatTruncatedList, pluralizeWithCount } from '@/utils/strings'
import {
  buildSubprocessorIndex,
  notListedVendorWhere,
  resolveVendorRow,
  type TRunSubprocessor,
  toListingInput,
  type TListingEdit,
  type TRowContext,
  type TVendorRow,
  withDuplicateProblems,
} from './vendor-subprocessor-rows'

const LISTING_BATCH_SIZE = 100
const WRITE_CONCURRENCY = 4
const NAMES_SHOWN = 3
const UNITED_STATES_COUNTRY_CODE = 'USA'

export const LOAD_ERROR_MESSAGE = 'We could not load your existing subprocessors, categories or vendor access. Please try again later.'

const INITIAL_DEFAULTS: TSubprocessorListingDefaults = { countries: [UNITED_STATES_COUNTRY_CODE], category: '' }

const vendorNames = (rows: readonly TVendorRow[]): string =>
  formatTruncatedList(
    rows.map((row) => vendorSubprocessorName(row.vendor)),
    rows.length,
    NAMES_SHOWN,
  )

const subprocessorIdFor = (row: TVendorRow, runResults: ReadonlyMap<string, TRunSubprocessor>): string | undefined =>
  row.target.kind === 'new' ? runResults.get(row.vendor.id)?.id : row.target.kind === 'listed' ? undefined : row.target.subprocessor.id

type TUnlinked = { rows: TVendorRow[]; firstError?: unknown }

const unlinkedSummary = ({ rows, firstError }: TUnlinked): string | undefined => (rows.length > 0 ? `${vendorNames(rows)} (${parseErrorMessage(firstError)})` : undefined)

export const useVendorSubprocessorSelection = () => {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const canCreateCategory = hasPermission(orgPermission?.roles, AccessEnum.CanCreateCustomTypeEnum, session)
  const canCreateSubprocessor = hasPermission(orgPermission?.roles, AccessEnum.CanCreateSubprocessor, session)

  const [isAdding, setIsAdding] = useState(false)
  const [selected, setSelected] = useState<ReadonlyMap<string, TVendorSubprocessorCandidate>>(() => new Map())
  const [edits, setEdits] = useState<Readonly<Record<string, TListingEdit>>>({})
  const [defaults, setDefaults] = useState<TSubprocessorListingDefaults>(INITIAL_DEFAULTS)
  const [runResults, setRunResults] = useState<ReadonlyMap<string, TRunSubprocessor>>(() => new Map())
  const [acknowledgedListedIds, setAcknowledgedListedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [visibleIds, setVisibleIds] = useState<readonly string[]>([])

  const catalogQuery = useSubprocessorCatalog({ enabled: !isAdding })
  const linksQuery = useTrustCenterSubprocessorLinks({ enabled: !isAdding })
  const categoriesQuery = useGetCustomTypeEnums({ where: SUBPROCESSOR_CATEGORY_WHERE })
  const selectedIds = useMemo(() => [...selected.keys()], [selected])
  const roleIds = useMemo(() => [...visibleIds, ...selectedIds], [visibleIds, selectedIds])
  const vendorRolesQuery = useAccountRolesMany({ objectType: ObjectTypes.ENTITY, ids: roleIds, enabled: !isAdding })
  const { mutateAsync: createSubprocessor } = useCreateSubprocessor()
  const { mutateAsync: updateSubprocessor } = useUpdateSubprocessor()
  const { mutateAsync: createBulkTrustCenterSubprocessor } = useCreateBulkTrustCenterSubprocessor()

  const listedSubprocessors = useMemo(() => (linksQuery.data ?? []).flatMap((link) => (link.subprocessor ? [link.subprocessor] : [])), [linksQuery.data])
  const index = useMemo(() => buildSubprocessorIndex(catalogQuery.data ?? [], listedSubprocessors, acknowledgedListedIds), [catalogQuery.data, listedSubprocessors, acknowledgedListedIds])

  const notListedWhere = useMemo(() => notListedVendorWhere(listedSubprocessors), [listedSubprocessors])
  const isListedResolved = linksQuery.isSuccess || linksQuery.isError

  const rolesData = vendorRolesQuery.data
  const [knownRoles, setKnownRoles] = useState<{ source?: typeof rolesData; roles: NonNullable<typeof rolesData>['object_roles'] }>({ roles: {} })
  if (rolesData && rolesData !== knownRoles.source) setKnownRoles({ source: rolesData, roles: { ...knownRoles.roles, ...rolesData.object_roles } })

  const canLinkVendor = useCallback(
    (vendorId: string): boolean | undefined => {
      const roles = knownRoles.roles[vendorId]
      if (roles) return canEdit(roles, session)
      return canEdit(undefined, session) || undefined
    },
    [knownRoles, session],
  )

  const { enumOptions } = categoriesQuery
  const chosenCategoriesKey = toCategoriesKey([defaults.category, ...Object.values(edits).map((edit) => edit.category ?? '')])
  const categoryOptions = useMemo(() => withChosenCategoryOptions(enumOptions, splitCategoriesKey(chosenCategoriesKey)), [enumOptions, chosenCategoriesKey])

  const context = useMemo<TRowContext>(
    () => ({ selectedIds: new Set(selectedIds), index, runResults, canLinkVendor, edits, defaults, categoryOptions: enumOptions, canCreateSubprocessor }),
    [selectedIds, index, runResults, canLinkVendor, edits, defaults, enumOptions, canCreateSubprocessor],
  )

  const selectedRows = useMemo(() => withDuplicateProblems([...selected.values()].map((vendor) => resolveVendorRow(vendor, context))), [selected, context])
  const selectedRowsById = useMemo(() => new Map(selectedRows.map((row) => [row.vendor.id, row])), [selectedRows])
  const activeRows = useMemo(() => selectedRows.filter((row) => row.selected), [selectedRows])
  const invalidCount = useMemo(() => activeRows.filter((row) => Object.keys(row.problems).length > 0).length, [activeRows])

  const resolveRows = useCallback(
    (vendors: readonly TVendorSubprocessorCandidate[]): TVendorRow[] => vendors.map((vendor) => selectedRowsById.get(vendor.id) ?? resolveVendorRow(vendor, context)),
    [selectedRowsById, context],
  )

  const setVendorsSelected = useCallback(
    (vendors: readonly TVendorSubprocessorCandidate[], isSelected: boolean) =>
      setSelected((current) => {
        const next = new Map(current)
        vendors.forEach((vendor) => (isSelected ? next.set(vendor.id, vendor) : next.delete(vendor.id)))
        return next
      }),
    [],
  )

  const syncVisibleVendors = useCallback((vendors: readonly TVendorSubprocessorCandidate[]) => {
    setVisibleIds(vendors.map((vendor) => vendor.id))
    setSelected((current) => {
      const stale = vendors.filter((vendor) => current.has(vendor.id) && current.get(vendor.id) !== vendor)
      if (stale.length === 0) return current
      const next = new Map(current)
      stale.forEach((vendor) => next.set(vendor.id, vendor))
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelected(new Map()), [])

  const updateEdit = useCallback((vendorId: string, patch: TListingEdit) => setEdits((current) => ({ ...current, [vendorId]: { ...current[vendorId], ...patch } })), [])

  const isError = catalogQuery.isError || linksQuery.isError || categoriesQuery.isError || vendorRolesQuery.isError
  const isCheckingVendorAccess = activeRows.some((row) => row.linkAccessPending)

  const blockedReason = (() => {
    if (catalogQuery.isPending || linksQuery.isPending || categoriesQuery.isLoading) return 'Checking your Trust Center...'
    if (isError) return LOAD_ERROR_MESSAGE
    if (activeRows.length === 0) return 'Select at least one vendor to add.'
    if (isCheckingVendorAccess) return 'Checking your access to the selected vendors...'
    if (invalidCount > 0) return `Resolve the issues on ${pluralizeWithCount(invalidCount, 'selected vendor')}.`
    return undefined
  })()

  const createMissingSubprocessors = async (rows: readonly TVendorRow[]): Promise<ReadonlyMap<string, TRunSubprocessor>> => {
    const nextResults = new Map(runResults)
    const failed: TVendorRow[] = []
    let firstError: unknown

    await mapWithConcurrency(
      rows.filter((row) => row.target.kind === 'new'),
      WRITE_CONCURRENCY,
      async (row) => {
        try {
          const variables = await toVendorSubprocessorVariables(row.vendor, { linkVendor: row.linkVendor })
          const { id } = (await createSubprocessor(variables)).createSubprocessor.subprocessor
          nextResults.set(row.vendor.id, { id, name: vendorSubprocessorName(row.vendor), linked: row.linkVendor })
        } catch (error) {
          failed.push(row)
          firstError ??= error
        }
      },
    )

    setRunResults(new Map(nextResults))
    if (failed.length > 0) {
      throw new UserFacingError(`Could not create a subprocessor for ${vendorNames(failed)}: ${parseErrorMessage(firstError)} Nothing was added to your Trust Center.`, { cause: firstError })
    }
    return nextResults
  }

  const linkOwnToVendors = async (rows: readonly TVendorRow[], results: ReadonlyMap<string, TRunSubprocessor>): Promise<TUnlinked> => {
    const unlinked: TUnlinked = { rows: [] }
    const nextResults = new Map(results)
    const links = rows.flatMap((row) => (row.target.kind === 'own' && row.linkVendor ? [{ row, subprocessor: row.target.subprocessor }] : []))
    await mapWithConcurrency(links, WRITE_CONCURRENCY, async ({ row, subprocessor }) => {
      try {
        await updateSubprocessor({ updateSubprocessorId: subprocessor.id, input: { addEntityIDs: [row.vendor.id] } })
        nextResults.set(row.vendor.id, { ...subprocessor, linked: true })
      } catch (error) {
        unlinked.rows.push(row)
        unlinked.firstError ??= error
      }
    })
    setRunResults(nextResults)
    return unlinked
  }

  const createListings = async (rows: readonly TVendorRow[], results: ReadonlyMap<string, TRunSubprocessor>): Promise<number> => {
    const listings = rows.flatMap((row) => {
      const subprocessorId = subprocessorIdFor(row, results)
      return subprocessorId ? [toListingInput(row, subprocessorId)] : []
    })

    let committed = 0
    try {
      for (const batch of chunk(listings, LISTING_BATCH_SIZE)) {
        await createBulkTrustCenterSubprocessor({ input: batch })
        committed += batch.length
        setAcknowledgedListedIds((current) => new Set([...current, ...batch.map((listing) => listing.subprocessorID)]))
      }
    } catch (error) {
      throw new UserFacingError(`${committed} of ${pluralizeWithCount(listings.length, 'subprocessor')} added to your Trust Center: ${parseErrorMessage(error)} Add again to retry the rest.`, {
        cause: error,
      })
    }
    return committed
  }

  const addSelected = async () => {
    const rows = activeRows
    setIsAdding(true)

    try {
      const results = await createMissingSubprocessors(rows)
      const unlinked = await linkOwnToVendors(rows, results)
      const added = await createListings(rows, results)
      return { added, created: rows.filter((row) => row.target.kind === 'new').length, unlinkedSummary: unlinkedSummary(unlinked) }
    } catch (error) {
      setIsAdding(false)
      throw error
    } finally {
      invalidateSubprocessorQueries(
        queryClient,
        rows.map((row) => row.category),
      )
    }
  }

  const retry = () => Promise.all([catalogQuery, linksQuery, categoriesQuery, vendorRolesQuery].filter((query) => query.isError).map((query) => query.refetch()))

  return {
    resolveRows,
    notListedWhere,
    isListedResolved,
    selectedRows,
    activeCount: activeRows.length,
    setVendorsSelected,
    syncVisibleVendors,
    clearSelection,
    updateEdit,
    defaults,
    setDefaults,
    categoryOptions,
    canCreateCategory,
    blockedReason,
    addSelected,
    isAdding,
    isError,
    retry,
  }
}
