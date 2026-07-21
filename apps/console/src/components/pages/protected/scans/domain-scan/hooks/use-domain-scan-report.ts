'use client'

import { useMemo } from 'react'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { usePlatformsWithFilter } from '@/lib/graphql-hooks/platform'
import { useSystemDetailsWithFilter } from '@/lib/graphql-hooks/system-detail'
import { useScan } from '@/lib/graphql-hooks/scan'
import {
  canonicalizeLookupValue,
  domainsFromNotification,
  findingsFromNotification,
  isDomainScanNotificationData,
  platformCandidateFromNotification,
  platformCandidatesFromSystems,
  sanitizeEntityName,
  systemCandidatesFromNotification,
  vendorsFromNotification,
} from '../notification-mappers'

export const useDomainScanReport = (scanIdParam: string | null) => {
  const { notifications } = useNotificationsContext()
  const { data: scanQuery } = useScan(scanIdParam ?? undefined)

  const matchedNotification = notifications.find((notification) => {
    if (notification.id === scanIdParam) return true
    const data: unknown = notification.data
    return isDomainScanNotificationData(data) && data.scans?.some((scan) => scan.internal_scan_id === scanIdParam)
  })

  const notificationData = useMemo(() => {
    const data: unknown = matchedNotification?.data
    return isDomainScanNotificationData(data) ? data : undefined
  }, [matchedNotification?.data])

  const vendors = useMemo(() => vendorsFromNotification(notificationData), [notificationData])
  const domains = useMemo(() => domainsFromNotification(notificationData), [notificationData])
  const findings = useMemo(() => findingsFromNotification(notificationData), [notificationData])
  const agentReadiness = notificationData?.findings?.agent_readiness
  const allDomains = useMemo(() => [...domains.owned, ...domains.external, ...domains.ip, ...domains.technologies], [domains])

  const singlePlatformCandidate = useMemo(() => platformCandidateFromNotification(notificationData, domains.hostname), [notificationData, domains.hostname])
  const systemCandidates = useMemo(() => systemCandidatesFromNotification(notificationData), [notificationData])
  const perSystemPlatformCandidates = useMemo(() => platformCandidatesFromSystems(systemCandidates), [systemCandidates])

  const vendorLookupNames = useMemo(() => Array.from(new Set(vendors.flatMap((vendor) => [vendor.name, sanitizeEntityName(vendor.name)]).filter(Boolean))), [vendors])
  const assetLookupNames = useMemo(() => Array.from(new Set(allDomains.map((domain) => domain.name).filter(Boolean))), [allDomains])
  const platformLookupNames = useMemo(
    () => Array.from(new Set([singlePlatformCandidate.name, ...perSystemPlatformCandidates.map((candidate) => candidate.name)].filter(Boolean))),
    [singlePlatformCandidate.name, perSystemPlatformCandidates],
  )
  const systemLookupNames = useMemo(() => Array.from(new Set(systemCandidates.map((candidate) => candidate.name).filter(Boolean))), [systemCandidates])

  const { vendorNodes } = useVendorsWithFilter({
    where: vendorLookupNames.length > 0 ? { or: [{ displayNameIn: vendorLookupNames }, { nameIn: vendorLookupNames }] } : undefined,
    enabled: vendorLookupNames.length > 0,
  })

  const { assetsNodes } = useAssetsWithFilter({
    where: assetLookupNames.length > 0 ? { or: [{ identifierIn: assetLookupNames }, { displayNameIn: assetLookupNames }, { nameIn: assetLookupNames }] } : undefined,
    enabled: assetLookupNames.length > 0,
  })

  const { platformsNodes } = usePlatformsWithFilter({
    where: platformLookupNames.length > 0 ? { nameIn: platformLookupNames } : undefined,
    enabled: platformLookupNames.length > 0,
  })

  const { systemDetailsNodes } = useSystemDetailsWithFilter({
    where: systemLookupNames.length > 0 ? { systemNameIn: systemLookupNames } : undefined,
    enabled: systemLookupNames.length > 0,
  })

  const existingVendorLookup = useMemo(() => {
    const lookup = new Set<string>()
    vendorNodes.forEach((vendor) => {
      if (vendor.displayName) lookup.add(canonicalizeLookupValue(vendor.displayName))
      if (vendor.name) lookup.add(canonicalizeLookupValue(vendor.name))
    })
    return lookup
  }, [vendorNodes])

  const existingAssetLookup = useMemo(() => {
    const lookup = new Set<string>()
    assetsNodes.forEach((asset) => {
      if (asset.identifier) lookup.add(canonicalizeLookupValue(asset.identifier))
      if (asset.displayName) lookup.add(canonicalizeLookupValue(asset.displayName))
      if (asset.name) lookup.add(canonicalizeLookupValue(asset.name))
    })
    return lookup
  }, [assetsNodes])

  const existingVendorIds = useMemo(
    () =>
      new Set(
        vendors
          .filter((vendor) => existingVendorLookup.has(canonicalizeLookupValue(vendor.name)) || existingVendorLookup.has(canonicalizeLookupValue(sanitizeEntityName(vendor.name))))
          .map((vendor) => vendor.id),
      ),
    [existingVendorLookup, vendors],
  )

  const existingAssetIds = useMemo(
    () => new Set(allDomains.filter((domain) => existingAssetLookup.has(canonicalizeLookupValue(domain.name))).map((domain) => domain.id)),
    [allDomains, existingAssetLookup],
  )

  const existingPlatformNames = useMemo(() => new Set(platformsNodes.map((platform) => canonicalizeLookupValue(platform.name)).filter(Boolean)), [platformsNodes])
  const existingSystemNames = useMemo(() => new Set(systemDetailsNodes.map((system) => canonicalizeLookupValue(system.systemName)).filter(Boolean)), [systemDetailsNodes])

  const selectionSeedKey = useMemo(
    () =>
      [
        matchedNotification?.id || scanIdParam || '',
        vendors.map((vendor) => vendor.id).join(','),
        allDomains.map((domain) => domain.id).join(','),
        findings.map((finding) => finding.id).join(','),
        systemCandidates.map((system) => system.id).join(','),
      ].join('|'),
    [allDomains, findings, matchedNotification?.id, scanIdParam, systemCandidates, vendors],
  )

  return {
    scanQuery,
    notificationData,
    vendors,
    domains,
    allDomains,
    findings,
    agentReadiness,
    singlePlatformCandidate,
    systemCandidates,
    perSystemPlatformCandidates,
    existingVendorIds,
    existingAssetIds,
    existingPlatformNames,
    existingSystemNames,
    selectionSeedKey,
  }
}

export type DomainScanReport = ReturnType<typeof useDomainScanReport>
