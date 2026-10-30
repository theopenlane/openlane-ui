'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@repo/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type UpdateVulnerabilityInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Callout } from '@/components/shared/callout/callout'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { useCreateAsset, type AssetsNodeNonNull } from '@/lib/graphql-hooks/asset'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { type TSelectedReport } from './exposure-bulk-actions'
import { exposureAssetLabel } from './exposure-model'
import { useExposureAssetEnvironment } from './use-exposure-asset-environment'

const ENVIRONMENT_FROM_ASSET = '__asset__'
const ENVIRONMENT_KEEP = '__keep__'

type TPickedAsset = Pick<AssetsNodeNonNull, 'id' | 'environmentName'>

type TApply = (input: UpdateVulnerabilityInput) => Promise<boolean>

const pickedEnvironments = (picked: ReadonlyMap<string, TPickedAsset>) => new Set([...picked.values()].map((asset) => asset.environmentName?.trim()).filter((name): name is string => !!name))

const resolveEnvironment = (choice: string, picked: ReadonlyMap<string, TPickedAsset>): Pick<UpdateVulnerabilityInput, 'environmentName'> => {
  if (choice === ENVIRONMENT_KEEP) return {}
  if (choice !== ENVIRONMENT_FROM_ASSET) return { environmentName: choice }
  const environments = pickedEnvironments(picked)
  return environments.size === 1 ? { environmentName: [...environments][0] } : {}
}

const environmentNote = (choice: string, picked: ReadonlyMap<string, TPickedAsset>, reports: TSelectedReport[]): string | null => {
  if (choice === ENVIRONMENT_FROM_ASSET) {
    const environments = pickedEnvironments(picked)
    if (environments.size > 1) return 'The picked assets have different environments, so report environments stay unchanged.'
    if (environments.size === 0) return 'The picked assets have no environment, so report environments stay unchanged.'
    return null
  }
  if (choice === ENVIRONMENT_KEEP) return null
  const shadowed = reports.filter((report) => report.hasAssetEnvironment).length + (pickedEnvironments(picked).size > 0 ? 1 : 0)
  return shadowed > 0 ? "The map groups a report by its linked asset's environment first, so reports linked to an asset with an environment stay under that environment." : null
}

const RowCheckbox: React.FC<{ checked: boolean }> = ({ checked }) => <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />

type TPanelProps = {
  reports: TSelectedReport[]
  onApply: TApply
  onClose: () => void
}

const AssetEnvironmentPanel: React.FC<TPanelProps> = ({ reports, onApply, onClose }) => {
  const [picked, setPicked] = useState<ReadonlyMap<string, TPickedAsset>>(() => new Map())
  const [createOwnerAsset, setCreateOwnerAsset] = useState(false)
  const [environmentChoice, setEnvironmentChoice] = useState(ENVIRONMENT_FROM_ASSET)
  const [isApplying, setIsApplying] = useState(false)
  const { errorNotification } = useNotification()
  const { mutateAsync: createAsset } = useCreateAsset()
  const data = useExposureAssetEnvironment(reports)

  const togglePicked = (asset: TPickedAsset) =>
    setPicked((current) => {
      const next = new Map(current)
      if (next.has(asset.id)) next.delete(asset.id)
      else next.set(asset.id, asset)
      return next
    })

  const hasAssets = picked.size > 0 || createOwnerAsset
  const effectiveChoice = !hasAssets && environmentChoice === ENVIRONMENT_FROM_ASSET ? ENVIRONMENT_KEEP : environmentChoice
  const environmentInput = resolveEnvironment(effectiveChoice, picked)
  const note = environmentNote(effectiveChoice, picked, reports)
  const hasChange = hasAssets || !!environmentInput.environmentName
  const reportCount = pluralizeWithCount(reports.length, 'report')

  const renderAssetRow = (asset: AssetsNodeNonNull) => (
    <CommandItem key={asset.id} value={asset.id} onSelect={() => togglePicked(asset)} className="flex items-center gap-2">
      <RowCheckbox checked={picked.has(asset.id)} />
      <span className="min-w-0 flex-1 truncate">{exposureAssetLabel(asset)}</span>
      {asset.assetType && <span className="shrink-0 text-xs text-muted-foreground">{getEnumLabel(asset.assetType)}</span>}
    </CommandItem>
  )

  const createOwnerAssetId = async (owner: string) => {
    const { createAsset: created } = await createAsset({ input: { name: owner, sourceIdentifier: owner } })
    const id = created.asset.id
    setPicked((current) => new Map(current).set(id, { id, environmentName: null }))
    setCreateOwnerAsset(false)
    return id
  }

  const handleApply = async () => {
    setIsApplying(true)
    try {
      const assetIds = new Set(picked.keys())
      if (createOwnerAsset && data.owner) assetIds.add(await createOwnerAssetId(data.owner))
      if (await onApply({ ...(assetIds.size ? { addAssetIDs: [...assetIds] } : {}), ...environmentInput })) onClose()
    } catch (error) {
      errorNotification({ title: 'Failed to create asset', description: parseErrorMessage(error) })
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <>
      <Command shouldFilter={false}>
        <CommandInput placeholder="Search assets" value={data.search.searchText} onValueChange={data.search.setSearchText} searching={data.isSearching} />
        <CommandList className="max-h-64">
          {!data.isSearching && <CommandEmpty>No assets found.</CommandEmpty>}
          {(data.canCreateOwnerAsset || data.suggestedAssets.length > 0) && (
            <CommandGroup heading="Suggested from source">
              {data.canCreateOwnerAsset && data.owner && (
                <CommandItem value={`create:${data.owner}`} onSelect={() => setCreateOwnerAsset((current) => !current)} className="flex items-center gap-2">
                  {createOwnerAsset ? <RowCheckbox checked /> : <Plus size={14} />}
                  <span className="min-w-0 flex-1 truncate">
                    Create asset <span className="font-mono font-medium">{data.owner}</span>
                  </span>
                </CommandItem>
              )}
              {data.suggestedAssets.map(renderAssetRow)}
            </CommandGroup>
          )}
          {!data.isSearching && data.assets.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Assets">{data.assets.map(renderAssetRow)}</CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
      <div className="space-y-3 border-t p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Environment</span>
          <Select value={effectiveChoice} onValueChange={setEnvironmentChoice}>
            <SelectTrigger className="h-8 w-48" aria-label="Environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hasAssets && <SelectItem value={ENVIRONMENT_FROM_ASSET}>Use asset&apos;s environment</SelectItem>}
              <SelectItem value={ENVIRONMENT_KEEP}>Keep current</SelectItem>
              {data.environmentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {note && <Callout variant="plain">{note}</Callout>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <DisabledReasonTooltip reason={hasChange ? undefined : 'Pick an asset or an environment.'}>
            <Button type="button" disabled={!hasChange || isApplying} onClick={handleApply}>
              {isApplying ? 'Applying…' : hasAssets ? `Link to ${reportCount}` : `Apply to ${reportCount}`}
            </Button>
          </DisabledReasonTooltip>
        </div>
      </div>
    </>
  )
}

type TExposureAssetEnvironmentPopoverProps = {
  reports: TSelectedReport[]
  disabled: boolean
  onApply: TApply
}

export const ExposureAssetEnvironmentPopover: React.FC<TExposureAssetEnvironmentPopoverProps> = ({ reports, disabled, onApply }) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="secondary" disabled={disabled}>
          Set asset / environment
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[380px] max-w-[calc(100vw-2rem)] p-0">
        <AssetEnvironmentPanel reports={reports} onApply={onApply} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
