import type {
  ImportDomainScanReviewAssetInput,
  ImportDomainScanReviewFindingInput,
  ImportDomainScanReviewInput,
  ImportDomainScanReviewPlatformInput,
  ImportDomainScanReviewSystemInput,
  ImportDomainScanReviewVendorInput,
} from '@repo/codegen/src/schema'
import { refValue, withOverride } from './notification-mappers'
import { resolveLinkedRefs, type LinkMap } from './selection-utils'
import type { DomainItem, Finding, OverrideMap, PlatformCandidate, PlatformMode, SystemCandidate, Vendor } from './types'

export type BuildImportPayloadArgs = {
  scanIds: string[]
  scanUrlByDomain: Map<string, string | undefined>
  platformMode: PlatformMode
  platformTargets: PlatformCandidate[]
  singlePlatformRef: string
  systemTargets: SystemCandidate[]
  selectedVendors: Vendor[]
  selectedAssets: DomainItem[]
  linkOnlyVendors: Vendor[]
  linkOnlyAssets: DomainItem[]
  vendorOverrides: OverrideMap
  assetOverrides: OverrideMap
  findingOverrides: OverrideMap
  selectedFindings: Finding[]
  platformVendorLinks: LinkMap
  platformAssetLinks: LinkMap
  systemVendorLinks: LinkMap
  systemAssetLinks: LinkMap
}

const hasName = <T extends { name: string }>(item: T) => item.name.trim().length > 0

export type ResolvedSystemTarget = {
  id: string
  name: string
  description?: string
  platformRefs: string[]
  linkSourceId: string
  usesPlatformLinks: boolean
}

export type ResolveSystemTargetsArgs = {
  platformMode: PlatformMode
  platformTargets: PlatformCandidate[]
  systemTargets: SystemCandidate[]
  singlePlatformRef: string
}

export const resolveSystemTargets = ({ platformMode, platformTargets, systemTargets, singlePlatformRef }: ResolveSystemTargetsArgs): ResolvedSystemTarget[] => {
  const namedPlatforms = platformTargets.filter(hasName)
  const namedSystems = systemTargets.filter(hasName)

  if (platformMode === 'single') {
    const platformRefs = namedPlatforms.some((platform) => platform.id === singlePlatformRef) ? [singlePlatformRef] : []

    return namedSystems.map((system) => ({
      id: system.id,
      name: system.name.trim(),
      description: system.description,
      platformRefs,
      linkSourceId: system.id,
      usesPlatformLinks: false,
    }))
  }

  const systemByRefValue = new Map(namedSystems.map((system) => [refValue(system.id), system]))
  const matchedSystemIds = new Set<string>()

  const platformBackedSystems = namedPlatforms.map((platform) => {
    const matchedSystem = systemByRefValue.get(refValue(platform.id))
    if (matchedSystem) {
      matchedSystemIds.add(matchedSystem.id)
    }

    return {
      id: platform.id,
      name: (matchedSystem?.name ?? platform.name).trim(),
      description: matchedSystem?.description ?? platform.description,
      platformRefs: [platform.id],
      linkSourceId: platform.id,
      usesPlatformLinks: true,
    }
  })

  const standaloneSystems = namedSystems
    .filter((system) => !matchedSystemIds.has(system.id))
    .map((system) => ({
      id: system.id,
      name: system.name.trim(),
      description: system.description,
      platformRefs: namedPlatforms.map((platform) => platform.id),
      linkSourceId: system.id,
      usesPlatformLinks: false,
    }))

  return [...platformBackedSystems, ...standaloneSystems]
}

export const buildImportDomainScanReviewInput = ({
  scanIds,
  scanUrlByDomain,
  platformMode,
  platformTargets,
  singlePlatformRef,
  systemTargets,
  selectedVendors,
  selectedAssets,
  linkOnlyVendors,
  linkOnlyAssets,
  vendorOverrides,
  assetOverrides,
  findingOverrides,
  selectedFindings,
  platformVendorLinks,
  platformAssetLinks,
  systemVendorLinks,
  systemAssetLinks,
}: BuildImportPayloadArgs): ImportDomainScanReviewInput => {
  const selectedVendorRefs = selectedVendors.map((vendor) => vendor.id)
  const selectedAssetRefs = selectedAssets.map((asset) => asset.id)
  const allowedVendorRefs = new Set([...selectedVendorRefs, ...linkOnlyVendors.map((vendor) => vendor.id)])
  const allowedAssetRefs = new Set([...selectedAssetRefs, ...linkOnlyAssets.map((asset) => asset.id)])

  const namedPlatforms = platformTargets.filter(hasName)

  const platformLinkedRefs = (targetId: string) => ({
    entityRefs: resolveLinkedRefs(platformVendorLinks, targetId, selectedVendorRefs, allowedVendorRefs),
    assetRefs: resolveLinkedRefs(platformAssetLinks, targetId, selectedAssetRefs, allowedAssetRefs),
  })

  const systemLinkedRefs = (systemId: string) => ({
    entityRefs: resolveLinkedRefs(systemVendorLinks, systemId, [], allowedVendorRefs),
    assetRefs: resolveLinkedRefs(systemAssetLinks, systemId, [], allowedAssetRefs),
  })

  const platformInputs: ImportDomainScanReviewPlatformInput[] = namedPlatforms.map((target) => ({
    ref: target.id,
    name: target.name.trim(),
    description: target.description,
    ...platformLinkedRefs(target.id),
  }))

  const systemInputs: ImportDomainScanReviewSystemInput[] = resolveSystemTargets({ platformMode, platformTargets, systemTargets, singlePlatformRef }).map((target) => ({
    name: target.name,
    description: target.description,
    platformRefs: target.platformRefs,
    ...(target.usesPlatformLinks ? platformLinkedRefs(target.linkSourceId) : systemLinkedRefs(target.linkSourceId)),
  }))

  const referencedVendorRefs = new Set([...platformInputs, ...systemInputs].flatMap((input) => input.entityRefs ?? []))
  const referencedAssetRefs = new Set([...platformInputs, ...systemInputs].flatMap((input) => input.assetRefs ?? []))

  const vendorInputs: ImportDomainScanReviewVendorInput[] = [...selectedVendors, ...linkOnlyVendors.filter((vendor) => referencedVendorRefs.has(vendor.id))].map((vendor) => {
    const resolved = withOverride(vendor, vendorOverrides)
    return {
      ref: vendor.id,
      name: resolved.name,
      domain: resolved.domain,
      categories: vendor.providedServices.length > 0 ? vendor.providedServices : undefined,
    }
  })

  const assetInputs: ImportDomainScanReviewAssetInput[] = [...selectedAssets, ...linkOnlyAssets.filter((asset) => referencedAssetRefs.has(asset.id))].map((asset) => {
    const resolved = withOverride(asset, assetOverrides)
    return {
      ref: asset.id,
      name: resolved.name,
      identifier: resolved.name,
      website: scanUrlByDomain.get(asset.name.toLowerCase()),
      categories: asset.kind === 'technology' && asset.categories?.length ? asset.categories : undefined,
    }
  })

  const findingInputs: ImportDomainScanReviewFindingInput[] = selectedFindings.map((finding) => {
    const override = findingOverrides[finding.id]
    const title = (override?.name ?? finding.title).trim()
    const description = override?.description !== undefined ? override.description : finding.description

    return {
      category: finding.category,
      description: description ? `${title}\n\n${description}` : title,
      severity: finding.severity,
    }
  })

  return {
    scanIDs: scanIds,
    platforms: platformInputs.length > 0 ? platformInputs : undefined,
    systems: systemInputs.length > 0 ? systemInputs : undefined,
    vendors: vendorInputs,
    assets: assetInputs,
    findings: findingInputs.length > 0 ? findingInputs : undefined,
  }
}
