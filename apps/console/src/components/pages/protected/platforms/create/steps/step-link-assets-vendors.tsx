'use client'

import React, { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Laptop, Building2 } from 'lucide-react'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { type EditPlatformFormData } from '../../hooks/use-form-schema'

type ItemInfo = { id: string; name: string }

type ScopeFieldName = keyof Pick<EditPlatformFormData, 'assetIDs' | 'outOfScopeAssetIDs' | 'entityIDs' | 'outOfScopeVendorIDs'>

interface MultiSelectProps {
  fieldName: ScopeFieldName
  oppositeFieldName?: ScopeFieldName
  disabledReason?: string
  label: string
  placeholder: string
  items: ItemInfo[]
  isLoading: boolean
  icon: React.ReactNode
}

const MultiSelectField: React.FC<MultiSelectProps> = ({ fieldName, oppositeFieldName, disabledReason, label, placeholder, items, isLoading, icon }) => {
  const form = useFormContext<EditPlatformFormData>()

  const watchedIDs = form.watch(fieldName) as string[] | undefined
  const selectedIds = useMemo(() => watchedIDs ?? [], [watchedIDs])

  const watchedOppositeIDs = form.watch(oppositeFieldName ?? fieldName) as string[] | undefined
  const oppositeSelectedIds = useMemo(() => new Set(oppositeFieldName ? (watchedOppositeIDs ?? []) : []), [oppositeFieldName, watchedOppositeIDs])

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
              icon={icon}
              placeholder={placeholder}
              disabledIds={oppositeSelectedIds}
              renderDisabledItem={(row, id) => (
                <TooltipProvider key={id} delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{row}</div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" sideOffset={-4}>
                      {disabledReason ?? 'Already selected in the opposite list'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
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

  const assets = useMemo(() => assetsNodes.map((a) => ({ id: a.id, name: a.name ?? a.id })), [assetsNodes])
  const vendors = useMemo(() => vendorNodes.map((v) => ({ id: v.id, name: v.displayName ?? v.name ?? v.id })), [vendorNodes])

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">All fields on this step are optional. Click Create to skip.</p>

      <div className="space-y-3">
        <h4 className="text-sm font-medium">Assets</h4>
        <MultiSelectField
          fieldName="assetIDs"
          oppositeFieldName="outOfScopeAssetIDs"
          disabledReason="Already selected as out-of-scope"
          label="In-scope Assets"
          placeholder="Select assets in scope..."
          items={assets}
          isLoading={assetsLoading}
          icon={<Laptop className="h-4 w-4" />}
        />
        <MultiSelectField
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
        <MultiSelectField
          fieldName="entityIDs"
          oppositeFieldName="outOfScopeVendorIDs"
          disabledReason="Already selected as out-of-scope"
          label="In-scope Vendors"
          placeholder="Select vendors in scope..."
          items={vendors}
          isLoading={vendorsLoading}
          icon={<Building2 className="h-4 w-4" />}
        />
        <MultiSelectField
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
