'use client'

import React from 'react'
import { type AssetAssetType } from '@repo/codegen/src/schema'
import { Building2, Layers, Monitor } from 'lucide-react'
import { SearchableItemSelect, type SearchableItem } from '@/components/shared/searchable-item-select/searchable-item-select'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useAssetOptions } from '@/lib/graphql-hooks/asset'
import { useVendorOptions, vendorEntitiesWhere, vendorSearchWhere } from '@/lib/graphql-hooks/entity'
import { usePlatformOptions } from '@/lib/graphql-hooks/platform'
import { useSystemDetailOptions } from '@/lib/graphql-hooks/system-detail'
import { type TLinkPickerProps } from './link-records-dialog'
import { AssetTypeIcon } from '@/components/shared/enum-mapper/asset-enum'
import { getAssetKindLabel, getAssetTitle } from '../../../asset-display'

type TRecordPickerProps<TItem extends SearchableItem> = Omit<TLinkPickerProps, 'knownItems'> & {
  knownItems?: TItem[]
  items: TItem[]
  isSearching: boolean
  isLoading: boolean
  onSearchTextChange: (value: string) => void
  icon: React.ReactNode | ((item: TItem) => React.ReactNode)
  renderItemEnd?: (item: TItem) => React.ReactNode
  placeholder: string
  multiple?: boolean
}

type TAssetItem = SearchableItem & { assetType?: AssetAssetType; assetSubtypeName?: string | null }

const RecordPicker = <TItem extends SearchableItem>({ labelId, items, isSearching, isLoading, ...props }: TRecordPickerProps<TItem>) => (
  <SearchableItemSelect aria-labelledby={labelId} items={isSearching ? [] : items} isLoading={isSearching || isLoading} {...props} />
)

export const AssetPicker: React.FC<Omit<TLinkPickerProps, 'knownItems'> & { excludeId: string; knownItems: TAssetItem[] }> = ({ excludeId, ...props }) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { options, isPending, isFetching } = useAssetOptions({
    idNEQ: excludeId,
    ...(debouncedTerm ? { or: [{ nameContainsFold: debouncedTerm }, { displayNameContainsFold: debouncedTerm }] } : {}),
  })
  const items: TAssetItem[] = options.map(({ assetType, assetSubtypeName, ...asset }) => ({ id: asset.id, name: getAssetTitle(asset), assetType, assetSubtypeName }))

  return (
    <RecordPicker
      {...props}
      items={items}
      isSearching={getIsSearching(isFetching)}
      isLoading={isPending}
      onSearchTextChange={setSearchText}
      icon={({ assetType }: TAssetItem) => assetType && <AssetTypeIcon assetType={assetType} size={14} />}
      renderItemEnd={(item: TAssetItem) => <span className="text-xs text-muted-foreground">{getAssetKindLabel(item)}</span>}
      placeholder="Search assets"
    />
  )
}

export const PlatformPicker: React.FC<TLinkPickerProps> = (props) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { options, isPending, isFetching } = usePlatformOptions(debouncedTerm ? { nameContainsFold: debouncedTerm } : undefined)

  return (
    <RecordPicker
      {...props}
      items={options.map(({ id, name }) => ({ id, name }))}
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
  const { options, isPending, isFetching } = useSystemDetailOptions(debouncedTerm ? { systemNameContainsFold: debouncedTerm } : undefined)

  return (
    <RecordPicker
      {...props}
      items={options.map(({ id, systemName }) => ({ id, name: systemName }))}
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
  const { vendorOptions, isPending, isFetching } = useVendorOptions({ where: vendorEntitiesWhere(vendorSearchWhere(debouncedTerm)) })
  const items = vendorOptions.filter(({ value }) => !disabledIds.includes(value)).map(({ value, label }) => ({ id: value, name: label }))

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
