'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { type TPagination } from '@repo/ui/pagination-types'
import { Callout } from '@/components/shared/callout/callout'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SubprocessorListingDefaults } from '@/components/pages/protected/trust-center/shared/subprocessor-listing-defaults'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useNotification } from '@/hooks/useNotification'
import { vendorSearchWhere } from '@/lib/graphql-hooks/entity'
import { useVendorSubprocessorCandidates } from '@/lib/graphql-hooks/subprocessor'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { sliceByPagination } from '@/utils/pagination'
import { pluralizeWithCount } from '@/utils/strings'
import { SUBPROCESSORS_HREF } from '../subprocessor-routes'
import { getVendorSubprocessorColumns } from './vendor-subprocessor-columns'
import { LOAD_ERROR_MESSAGE, useVendorSubprocessorSelection } from './use-vendor-subprocessor-selection'

const VIEW = { all: 'all', selected: 'selected' } as const
type TView = (typeof VIEW)[keyof typeof VIEW]

type TSearchPagination = { term: string; pagination: TPagination }

export const VendorSubprocessorPicker: React.FC = () => {
  const router = useRouter()
  const { successNotification, errorNotification, warningNotification } = useNotification()
  const {
    resolveRows,
    selectedRows,
    activeCount,
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
  } = useVendorSubprocessorSelection()
  const addingRef = useRef(false)

  const [view, setView] = useState<TView>(VIEW.all)
  const [selectedPagination, setSelectedPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const [searchPagination, setSearchPagination] = useState<TSearchPagination>({ term: '', pagination: DEFAULT_PAGINATION })
  const pagination = searchPagination.term === debouncedTerm ? searchPagination.pagination : DEFAULT_PAGINATION
  const setPagination = (next: TPagination) => setSearchPagination({ term: debouncedTerm, pagination: next })

  const candidates = useVendorSubprocessorCandidates({ where: vendorSearchWhere(debouncedTerm), pagination, enabled: !isAdding })
  const searching = getIsSearching(candidates.isFetching && !!debouncedTerm)

  useEffect(() => syncVisibleVendors(candidates.vendors), [candidates.vendors, syncVisibleVendors])

  const isAllView = view === VIEW.all
  const selectedPage = Math.min(selectedPagination.page, Math.max(1, Math.ceil(selectedRows.length / selectedPagination.pageSize)))
  const visibleSelectedPagination = useMemo(() => ({ ...selectedPagination, page: selectedPage }), [selectedPagination, selectedPage])
  const rows = useMemo(
    () => (isAllView ? resolveRows(candidates.vendors) : sliceByPagination(selectedRows, visibleSelectedPagination)),
    [isAllView, resolveRows, candidates.vendors, selectedRows, visibleSelectedPagination],
  )
  const columns = useMemo(
    () => getVendorSubprocessorColumns({ categoryOptions, canCreateCategory, disabled: isAdding, onSelect: setVendorsSelected, onEdit: updateEdit }),
    [categoryOptions, canCreateCategory, isAdding, setVendorsSelected, updateEdit],
  )

  const handleAdd = async () => {
    if (addingRef.current) return
    addingRef.current = true
    try {
      const { added, created, unlinkedSummary } = await addSelected()
      successNotification({
        title: 'Subprocessors added',
        description: `${pluralizeWithCount(added, 'subprocessor')} added to your Trust Center${created > 0 ? `, including ${pluralizeWithCount(created, 'new subprocessor')}` : ''}.`,
      })
      if (unlinkedSummary) {
        warningNotification({
          title: 'Some subprocessors were not linked to their vendor',
          description: `Listed on your Trust Center, but not linked back to the vendor: ${unlinkedSummary}.`,
        })
      }
      router.push(SUBPROCESSORS_HREF)
    } catch (error) {
      errorNotification({ title: 'Could not add subprocessors', description: parseErrorMessage(error) })
    } finally {
      addingRef.current = false
    }
  }

  const noResultsText = isAllView ? (debouncedTerm ? 'No vendors match your search.' : 'You have no vendors yet.') : 'No vendors selected.'

  return (
    <div className="flex flex-col gap-4">
      {isError && (
        <Callout
          variant="warning"
          action={
            <Button variant="secondary" onClick={() => retry()}>
              Retry
            </Button>
          }
        >
          {LOAD_ERROR_MESSAGE}
        </Callout>
      )}

      {candidates.isError && (
        <Callout
          variant="warning"
          action={
            <Button variant="secondary" onClick={() => candidates.refetch()}>
              Retry
            </Button>
          }
        >
          We could not load your vendors. Please try again later.
        </Callout>
      )}

      <SubprocessorListingDefaults
        title="Defaults for selected vendors"
        description="Applied to every selected vendor you have not changed. A vendor whose provided services match a category uses that category instead."
        defaults={defaults}
        onChange={setDefaults}
        categoryOptions={categoryOptions}
        canCreateCategory={canCreateCategory}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="w-full max-w-60">
            <Input
              icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
              placeholder="Search vendors..."
              value={searchText}
              onChange={(event) => setSearchText(event.currentTarget.value)}
              variant="searchTable"
              className="w-full"
              disabled={!isAllView}
            />
          </div>
          <Tabs value={view} onValueChange={(value) => setView(value === VIEW.selected ? VIEW.selected : VIEW.all)} variant="solid">
            <TabsList className="w-fit">
              <TabsTrigger value={VIEW.all}>All vendors</TabsTrigger>
              <TabsTrigger value={VIEW.selected}>Selected ({selectedRows.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedRows.length > 0 && (
            <Button variant="secondary" onClick={clearSelection} disabled={isAdding}>
              Clear selection
            </Button>
          )}
          <DisabledReasonTooltip reason={isAdding ? undefined : blockedReason}>
            <Button variant="primary" onClick={handleAdd} loading={isAdding} disabled={isAdding || !!blockedReason}>
              {isAdding ? 'Adding...' : `Add ${pluralizeWithCount(activeCount, 'subprocessor')}`}
            </Button>
          </DisabledReasonTooltip>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.vendor.id}
        loading={isAllView && (candidates.isPending || searching)}
        noResultsText={isAllView && candidates.isError ? 'Vendors could not be loaded.' : noResultsText}
        tableKey={undefined}
        {...(isAllView
          ? { pagination, onPaginationChange: setPagination, paginationMeta: candidates.paginationMeta }
          : { pagination: visibleSelectedPagination, onPaginationChange: setSelectedPagination, paginationMeta: { totalCount: selectedRows.length } })}
      />
    </div>
  )
}
