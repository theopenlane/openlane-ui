'use client'

import React, { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useDebounce } from '@uidotdev/usehooks'
import { Building2 } from 'lucide-react'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { type ContactFormData } from '../../../hooks/use-form-schema'

const VendorSelectField: React.FC = () => {
  const form = useFormContext<ContactFormData>()
  const entityIDs = form.watch('entityIDs') ?? []
  const [searchText, setSearchText] = useState('')
  const debouncedSearch = useDebounce(searchText, 300).trim()
  const isSearchSettled = searchText.trim() === debouncedSearch
  const { vendorNodes, isLoading, isPlaceholderData } = useVendorsWithFilter({
    where: debouncedSearch ? { or: [{ displayNameContainsFold: debouncedSearch }, { nameContainsFold: debouncedSearch }] } : undefined,
    enabled: debouncedSearch.length > 0,
  })
  const vendors = useMemo(() => vendorNodes.map((vendor) => ({ id: vendor.id, name: vendor.displayName ?? vendor.name ?? vendor.id })), [vendorNodes])

  return (
    <SearchableItemSelect
      selectedIds={entityIDs}
      onSelectedIdsChange={(ids) => form.setValue('entityIDs', ids, { shouldDirty: true })}
      items={isSearchSettled && !isPlaceholderData ? vendors : []}
      isLoading={isLoading || !isSearchSettled || isPlaceholderData}
      icon={<Building2 className="h-4 w-4" />}
      placeholder="Select a vendor..."
      searchPlaceholder="Search vendors..."
      emptyMessage={debouncedSearch ? 'No vendors found.' : 'Type to search vendors.'}
      multiple={false}
      onSearchTextChange={setSearchText}
      filterItems={false}
    />
  )
}

export default VendorSelectField
