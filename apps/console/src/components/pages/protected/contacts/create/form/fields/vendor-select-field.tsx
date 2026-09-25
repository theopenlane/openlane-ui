'use client'

import React, { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDebounce } from '@uidotdev/usehooks'
import { Building2 } from 'lucide-react'
import { SearchableItemSelect, type SearchableItem } from '@/components/shared/searchable-item-select/searchable-item-select'
import { useVendorsWithFilter, vendorDisplayName, vendorSearchWhere } from '@/lib/graphql-hooks/entity'
import { type ContactFormData } from '../../../hooks/use-form-schema'
import { useVendorSuggestions } from '../../../hooks/use-vendor-suggestions'
import { getVendorSearchState } from './vendor-search-state'

const NO_IDS: string[] = []
const NO_VENDORS: SearchableItem[] = []

const VendorSelectField: React.FC = () => {
  const form = useFormContext<ContactFormData>()
  const entityIDs = form.watch('entityIDs') ?? NO_IDS
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText, 300).trim() // 300ms
  const isSearchSettled = searchText.trim() === debouncedSearch
  const { vendorNodes, isLoading, isPlaceholderData, isError } = useVendorsWithFilter({
    where: vendorSearchWhere(debouncedSearch),
    enabled: debouncedSearch.length > 0,
  })
  const { matches } = useVendorSuggestions()

  const vendors = useMemo(() => vendorNodes.map((vendor) => ({ id: vendor.id, name: vendorDisplayName(vendor) })), [vendorNodes])
  const suggestedVendors = useMemo(() => matches.map((vendor) => ({ id: vendor.id, name: vendorDisplayName(vendor) })), [matches])
  const searchState = getVendorSearchState({ searchText, isSearchSettled, isLoading, isPlaceholderData, isError })
  const emptyMessage = isError ? 'Could not load vendors. Try again.' : debouncedSearch ? 'No vendors found.' : 'Type to search vendors.'

  return (
    <div>
      <span className="font-medium text-sm block mb-1">Linked vendor</span>
      <SearchableItemSelect
        selectedIds={entityIDs}
        onSelectedIdsChange={(ids) => form.setValue('entityIDs', ids, { shouldDirty: true })}
        items={searchState.canShowResults ? vendors : NO_VENDORS}
        knownItems={suggestedVendors}
        isLoading={searchState.isPending}
        icon={<Building2 className="h-4 w-4" />}
        placeholder="Select a vendor..."
        searchPlaceholder="Search vendors..."
        emptyMessage={emptyMessage}
        multiple={false}
        onSearchTextChange={setSearchText}
      />
    </div>
  )
}

export default VendorSelectField
