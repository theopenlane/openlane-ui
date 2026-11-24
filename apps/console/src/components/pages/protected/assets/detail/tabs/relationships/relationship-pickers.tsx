'use client'

import React from 'react'
import { Building2, Laptop, Layers, Monitor } from 'lucide-react'
import { SearchableItemSelect, type SearchableItem } from '@/components/shared/searchable-item-select/searchable-item-select'
import { DEFAULT_PAGINATION, MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { useVendorsWithFilter, vendorDisplayName, vendorSearchWhere } from '@/lib/graphql-hooks/entity'
import { usePlatformsWithFilter } from '@/lib/graphql-hooks/platform'
import { useSystemDetailsWithFilter } from '@/lib/graphql-hooks/system-detail'
import { type TLinkPickerProps } from './link-records-dialog'
import { getAssetTitle } from '../../../asset-display'

const PICKER_PAGINATION = { ...DEFAULT_PAGINATION, pageSize: MAX_CONNECTION_RESULTS, query: { first: MAX_CONNECTION_RESULTS } }

type TRecordPickerProps = TLinkPickerProps & {
  items: SearchableItem[]
  isSearching: boolean
  isLoading: boolean
  onSearchTextChange: (value: string) => void
  icon: React.ReactNode
  placeholder: string
  multiple?: boolean
}

const RecordPicker: React.FC<TRecordPickerProps> = ({ labelId, items, isSearching, isLoading, ...props }) => (
  <SearchableItemSelect aria-labelledby={labelId} items={isSearching ? [] : items} isLoading={isSearching || isLoading} {...props} />
)

export const AssetPicker: React.FC<TLinkPickerProps & { excludeId: string }> = ({ excludeId, ...props }) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { assetsNodes, isPending, isFetching } = useAssetsWithFilter({
    where: { idNEQ: excludeId, ...(debouncedTerm ? { or: [{ nameContainsFold: debouncedTerm }, { displayNameContainsFold: debouncedTerm }] } : {}) },
    pagination: PICKER_PAGINATION,
  })
  const items = assetsNodes.map((asset) => ({ id: asset.id, name: getAssetTitle(asset) }))

  return (
    <RecordPicker {...props} items={items} isSearching={getIsSearching(isFetching)} isLoading={isPending} onSearchTextChange={setSearchText} icon={<Laptop size={14} />} placeholder="Search assets" />
  )
}

export const PlatformPicker: React.FC<TLinkPickerProps> = (props) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { platformsNodes, isPending, isFetching } = usePlatformsWithFilter({ where: debouncedTerm ? { nameContainsFold: debouncedTerm } : undefined, pagination: PICKER_PAGINATION })

  return (
    <RecordPicker
      {...props}
      items={platformsNodes.map(({ id, name }) => ({ id, name }))}
      isSearching={getIsSearching(isFetching)}
      isLoading={isPending}
      onSearchTextChange={setSearchText}
      icon={<Layers size={14} />}
      placeholder="Search platforms"
    />
  )
}

export const SystemPicker: React.FC<TLinkPickerProps> = (props) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { systemDetailsNodes, isPending, isFetching } = useSystemDetailsWithFilter({ where: debouncedTerm ? { systemNameContainsFold: debouncedTerm } : undefined, pagination: PICKER_PAGINATION })

  return (
    <RecordPicker
      {...props}
      items={systemDetailsNodes.map(({ id, systemName }) => ({ id, name: systemName }))}
      isSearching={getIsSearching(isFetching)}
      isLoading={isPending}
      onSearchTextChange={setSearchText}
      icon={<Monitor size={14} />}
      placeholder="Search systems"
    />
  )
}

export const VendorPicker: React.FC<TLinkPickerProps & { disabledIds: string[] }> = ({ disabledIds, ...props }) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { vendorNodes, isPending, isFetching } = useVendorsWithFilter({ where: vendorSearchWhere(debouncedTerm), pagination: PICKER_PAGINATION })
  const items = vendorNodes.filter(({ id }) => !disabledIds.includes(id)).map((vendor) => ({ id: vendor.id, name: vendorDisplayName(vendor) }))

  return (
    <RecordPicker
      {...props}
      multiple={false}
      items={items}
      isSearching={getIsSearching(isFetching)}
      isLoading={isPending}
      onSearchTextChange={setSearchText}
      icon={<Building2 size={14} />}
      placeholder="Search vendors"
    />
  )
}
