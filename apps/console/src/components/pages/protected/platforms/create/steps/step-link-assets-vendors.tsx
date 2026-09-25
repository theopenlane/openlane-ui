'use client'

import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Laptop, Building2 } from 'lucide-react'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select/searchable-item-select'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { useVendorsWithFilter, vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { useGetCustomTypeEnums, type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { CustomTypeEnumOptionChip } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'

type ItemInfo = { id: string; name: string; scopeOption?: CustomTypeEnumOption }

const NO_IDS: string[] = []

const toScopeOption = (scopeName: string | null | undefined, optionsByValue: Map<string, CustomTypeEnumOption>): CustomTypeEnumOption | undefined =>
  scopeName ? (optionsByValue.get(scopeName) ?? { value: scopeName, label: scopeName }) : undefined

type ScopeFieldName = keyof Pick<EditPlatformFormData, 'assetIDs' | 'outOfScopeAssetIDs' | 'entityIDs' | 'outOfScopeVendorIDs'>

interface LinkItemsFieldProps {
  fieldName: ScopeFieldName
  oppositeFieldName?: ScopeFieldName
  disabledReason?: string
  label: string
  placeholder: string
  items: ItemInfo[]
  isLoading: boolean
  icon: React.ReactNode
}

const LinkItemsField: React.FC<LinkItemsFieldProps> = ({ fieldName, oppositeFieldName, disabledReason, label, placeholder, items, isLoading, icon }) => {
  const form = useFormContext<EditPlatformFormData>()

  const watchedIDs = form.watch(fieldName) as string[] | undefined
  const selectedIds = useMemo(() => watchedIDs ?? [], [watchedIDs])

  const watchedOppositeIDs = form.watch(oppositeFieldName ?? fieldName) as string[] | undefined
  const oppositeSelectedIds = useMemo(() => new Set(oppositeFieldName ? (watchedOppositeIDs ?? []) : NO_IDS), [oppositeFieldName, watchedOppositeIDs])

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={() => (
        <FormItem>
          <FormLabel className="block">{label}</FormLabel>
          <FormControl>
            <SearchableItemSelect
              selectedIds={selectedIds}
              onSelectedIdsChange={(ids) => form.setValue(fieldName, ids as never)}
              items={items}
              isLoading={isLoading}
              filterItems
              icon={icon}
              placeholder={placeholder}
              renderItemEnd={(item) => item.scopeOption && <CustomTypeEnumOptionChip option={item.scopeOption} />}
              disabledReason={(item) => (oppositeSelectedIds.has(item.id) ? (disabledReason ?? 'Already selected in the opposite list') : undefined)}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

const StepLinkAssetsVendors: React.FC = () => {
  const { assetsNodes, isLoading: assetsLoading } = useAssetsWithFilter({ enabled: true })
  const { vendorNodes, isLoading: vendorsLoading } = useVendorsWithFilter({
    enabled: true,
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({ where: { field: 'scope' } })
  const scopeOptionsByValue = useMemo(() => new Map(scopeOptions.map((option) => [option.value, option])), [scopeOptions])

  const assets = useMemo(() => assetsNodes.map((a) => ({ id: a.id, name: a.name ?? a.id, scopeOption: toScopeOption(a.scopeName, scopeOptionsByValue) })), [assetsNodes, scopeOptionsByValue])
  const vendors = useMemo(() => vendorNodes.map((v) => ({ id: v.id, name: vendorDisplayName(v), scopeOption: toScopeOption(v.scopeName, scopeOptionsByValue) })), [vendorNodes, scopeOptionsByValue])

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">All fields on this step are optional. Click Create to skip.</p>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Assets</h4>
        <LinkItemsField
          fieldName="assetIDs"
          oppositeFieldName="outOfScopeAssetIDs"
          disabledReason="Already selected as out-of-scope"
          label="In-scope Assets"
          placeholder="Select assets in scope..."
          items={assets}
          isLoading={assetsLoading}
          icon={<Laptop className="h-4 w-4" />}
        />
        <LinkItemsField
          fieldName="outOfScopeAssetIDs"
          oppositeFieldName="assetIDs"
          disabledReason="Already selected as in-scope"
          label="Out-of-scope Assets"
          placeholder="Select assets out of scope..."
          items={assets}
          isLoading={assetsLoading}
          icon={<Laptop className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Vendors</h4>
        <LinkItemsField
          fieldName="entityIDs"
          oppositeFieldName="outOfScopeVendorIDs"
          disabledReason="Already selected as out-of-scope"
          label="In-scope Vendors"
          placeholder="Select vendors in scope..."
          items={vendors}
          isLoading={vendorsLoading}
          icon={<Building2 className="h-4 w-4" />}
        />
        <LinkItemsField
          fieldName="outOfScopeVendorIDs"
          oppositeFieldName="entityIDs"
          disabledReason="Already selected as in-scope"
          label="Out-of-scope Vendors"
          placeholder="Select vendors out of scope..."
          items={vendors}
          isLoading={vendorsLoading}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}

export default StepLinkAssetsVendors
