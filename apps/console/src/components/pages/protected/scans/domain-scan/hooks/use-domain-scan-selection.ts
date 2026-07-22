'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeRef, refValue, resolveVendorLogoUrl, withOverride } from '../notification-mappers'
import { linkSetsFromRecord, linkSetsToRecord, type LinkMap } from '../selection-utils'
import { loadDomainScanProgress, saveDomainScanProgress } from '../progress-storage'
import type { DomainScanReport } from './use-domain-scan-report'
import { isStepId, type LinkableItem, type OverrideMap, type PlatformMode, type StepId, type SystemCandidate, type TextOverride } from '../types'

const MANUAL_SYSTEM_PREFIX = 'manual-'

export const isManualSystemId = (id: string) => refValue(id).startsWith(MANUAL_SYSTEM_PREFIX)

type UseDomainScanSelectionArgs = {
  report: DomainScanReport
  storageKey?: string
  currentStepId: StepId
  goToStep: (stepId: StepId) => void
}

export const useDomainScanSelection = ({ report, storageKey, currentStepId, goToStep }: UseDomainScanSelectionArgs) => {
  const { vendors, domains, allDomains, findings, singlePlatformCandidate, systemCandidates, perSystemPlatformCandidates, existingVendorIds, existingAssetIds, selectionSeedKey } = report

  const [hasStarted, setHasStarted] = useState(false)
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(() => new Set())
  const [selectedDomainIds, setSelectedDomainIds] = useState<Set<string>>(() => new Set())
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(() => new Set())

  const [platformMode, setPlatformMode] = useState<PlatformMode>('single')
  const [singlePlatformOverride, setSinglePlatformOverride] = useState<TextOverride>({})
  const [selectedPerSystemPlatformIds, setSelectedPerSystemPlatformIds] = useState<Set<string>>(() => new Set())
  const [perSystemPlatformOverrides, setPerSystemPlatformOverrides] = useState<OverrideMap>({})

  const [systemOverrides, setSystemOverrides] = useState<OverrideMap>({})
  const [manualSystems, setManualSystems] = useState<SystemCandidate[]>([])
  const [removedDetectedSystemIds, setRemovedDetectedSystemIds] = useState<Set<string>>(() => new Set())

  const [vendorOverrides, setVendorOverrides] = useState<OverrideMap>({})
  const [domainOverrides, setDomainOverrides] = useState<OverrideMap>({})
  const [findingOverrides, setFindingOverrides] = useState<OverrideMap>({})

  const [platformVendorLinks, setPlatformVendorLinks] = useState<LinkMap>({})
  const [platformAssetLinks, setPlatformAssetLinks] = useState<LinkMap>({})
  const [systemVendorLinks, setSystemVendorLinks] = useState<LinkMap>({})
  const [systemAssetLinks, setSystemAssetLinks] = useState<LinkMap>({})

  const initializedSelectionKeyRef = useRef('')
  const goToStepRef = useRef(goToStep)

  useEffect(() => {
    goToStepRef.current = goToStep
  }, [goToStep])

  useEffect(() => {
    if (!storageKey || !selectionSeedKey || initializedSelectionKeyRef.current === selectionSeedKey) {
      return
    }

    const saved = loadDomainScanProgress(storageKey)
    if (!saved) {
      return
    }

    initializedSelectionKeyRef.current = selectionSeedKey
    setHasStarted(saved.hasStarted)
    setSelectedVendorIds(new Set(saved.selectedVendorIds))
    setSelectedDomainIds(new Set(saved.selectedDomainIds))
    setSelectedFindingIds(new Set(saved.selectedFindingIds))
    setPlatformMode(saved.platformMode)
    setSinglePlatformOverride(saved.singlePlatformOverride)
    setSelectedPerSystemPlatformIds(new Set(saved.selectedPerSystemPlatformIds))
    setPerSystemPlatformOverrides(saved.perSystemPlatformOverrides)
    setSystemOverrides(saved.systemOverrides)
    setManualSystems(saved.manualSystems)
    setRemovedDetectedSystemIds(new Set(saved.removedDetectedSystemIds))
    setVendorOverrides(saved.vendorOverrides)
    setDomainOverrides(saved.domainOverrides)
    setFindingOverrides(saved.findingOverrides)
    setPlatformVendorLinks(linkSetsFromRecord(saved.platformVendorLinks))
    setPlatformAssetLinks(linkSetsFromRecord(saved.platformAssetLinks))
    setSystemVendorLinks(linkSetsFromRecord(saved.systemVendorLinks))
    setSystemAssetLinks(linkSetsFromRecord(saved.systemAssetLinks))
    if (isStepId(saved.stepId)) {
      goToStepRef.current(saved.stepId)
    }
  }, [selectionSeedKey, storageKey])

  useEffect(() => {
    if (!selectionSeedKey || initializedSelectionKeyRef.current === selectionSeedKey) {
      return
    }

    initializedSelectionKeyRef.current = selectionSeedKey
    setHasStarted(false)
    setSelectedVendorIds(new Set(vendors.filter((vendor) => vendor.url).map((vendor) => vendor.id)))
    setSelectedDomainIds(new Set([...domains.owned.filter((domain) => domain.primary).map((domain) => domain.id), ...domains.technologies.map((domain) => domain.id)]))
    setSelectedFindingIds(new Set(findings.map((finding) => finding.id)))
    setSelectedPerSystemPlatformIds(new Set(perSystemPlatformCandidates.map((candidate) => candidate.id)))
    setRemovedDetectedSystemIds(new Set())
    setManualSystems([])
  }, [domains.owned, domains.technologies, findings, perSystemPlatformCandidates, selectionSeedKey, vendors])

  const selectedVendorObjects = useMemo(() => vendors.filter((vendor) => selectedVendorIds.has(vendor.id)), [selectedVendorIds, vendors])
  const selectedDomainObjects = useMemo(() => allDomains.filter((domain) => selectedDomainIds.has(domain.id)), [allDomains, selectedDomainIds])
  const selectedFindingObjects = useMemo(() => findings.filter((finding) => selectedFindingIds.has(finding.id)), [findings, selectedFindingIds])

  const linkOnlyVendors = useMemo(() => vendors.filter((vendor) => existingVendorIds.has(vendor.id) && !selectedVendorIds.has(vendor.id)), [existingVendorIds, selectedVendorIds, vendors])
  const linkOnlyAssets = useMemo(() => allDomains.filter((domain) => existingAssetIds.has(domain.id) && !selectedDomainIds.has(domain.id)), [allDomains, existingAssetIds, selectedDomainIds])

  const toLinkableVendor = useCallback(
    (vendor: (typeof vendors)[number]): LinkableItem => {
      const resolved = withOverride(vendor, vendorOverrides)
      return { id: resolved.id, name: resolved.name, logoUrl: resolved.domain ? resolveVendorLogoUrl(resolved.domain) : vendor.logoUrl }
    },
    [vendorOverrides],
  )

  const linkVendors = useMemo(() => [...selectedVendorObjects, ...linkOnlyVendors].map(toLinkableVendor), [linkOnlyVendors, selectedVendorObjects, toLinkableVendor])
  const linkAssets = useMemo<LinkableItem[]>(
    () => [...selectedDomainObjects, ...linkOnlyAssets].map((domain) => withOverride(domain, domainOverrides)).map((domain) => ({ id: domain.id, name: domain.name })),
    [domainOverrides, linkOnlyAssets, selectedDomainObjects],
  )

  const defaultLinkedVendorIds = useMemo(() => selectedVendorObjects.map((vendor) => vendor.id), [selectedVendorObjects])
  const defaultLinkedAssetIds = useMemo(() => selectedDomainObjects.map((domain) => domain.id), [selectedDomainObjects])

  const resolvedSinglePlatformTarget = useMemo(() => withOverride(singlePlatformCandidate, { [singlePlatformCandidate.id]: singlePlatformOverride }), [singlePlatformCandidate, singlePlatformOverride])
  const resolvedPerSystemPlatformTargets = useMemo(
    () => perSystemPlatformCandidates.filter((candidate) => selectedPerSystemPlatformIds.has(candidate.id)).map((candidate) => withOverride(candidate, perSystemPlatformOverrides)),
    [perSystemPlatformCandidates, perSystemPlatformOverrides, selectedPerSystemPlatformIds],
  )
  const platformTargets = platformMode === 'single' ? [resolvedSinglePlatformTarget] : resolvedPerSystemPlatformTargets

  const displaySystemCandidates = useMemo(
    () => [...systemCandidates.filter((candidate) => !removedDetectedSystemIds.has(candidate.id)), ...manualSystems],
    [manualSystems, removedDetectedSystemIds, systemCandidates],
  )
  const resolvedSystemTargets = useMemo(() => displaySystemCandidates.map((candidate) => withOverride(candidate, systemOverrides)), [displaySystemCandidates, systemOverrides])

  const confirmFindings = useMemo<LinkableItem[]>(
    () => selectedFindingObjects.map((finding) => ({ id: finding.id, name: findingOverrides[finding.id]?.name ?? finding.title })),
    [findingOverrides, selectedFindingObjects],
  )

  const addManualSystem = useCallback(() => {
    setManualSystems((prev) => [...prev, { id: makeRef('system', `${MANUAL_SYSTEM_PREFIX}${Date.now()}`), name: '', description: '' }])
  }, [])

  const removeSystem = useCallback((id: string) => {
    if (isManualSystemId(id)) {
      setManualSystems((prev) => prev.filter((system) => system.id !== id))
    } else {
      setRemovedDetectedSystemIds((prev) => new Set(prev).add(id))
    }
    setSystemOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const persistProgress = useCallback(() => {
    if (!storageKey) return

    saveDomainScanProgress(storageKey, {
      hasStarted,
      stepId: currentStepId,
      selectedVendorIds: Array.from(selectedVendorIds),
      selectedDomainIds: Array.from(selectedDomainIds),
      selectedFindingIds: Array.from(selectedFindingIds),
      platformMode,
      singlePlatformOverride,
      selectedPerSystemPlatformIds: Array.from(selectedPerSystemPlatformIds),
      perSystemPlatformOverrides,
      systemOverrides,
      manualSystems,
      removedDetectedSystemIds: Array.from(removedDetectedSystemIds),
      vendorOverrides,
      domainOverrides,
      findingOverrides,
      platformVendorLinks: linkSetsToRecord(platformVendorLinks),
      platformAssetLinks: linkSetsToRecord(platformAssetLinks),
      systemVendorLinks: linkSetsToRecord(systemVendorLinks),
      systemAssetLinks: linkSetsToRecord(systemAssetLinks),
    })
  }, [
    currentStepId,
    domainOverrides,
    findingOverrides,
    hasStarted,
    manualSystems,
    perSystemPlatformOverrides,
    platformAssetLinks,
    platformMode,
    platformVendorLinks,
    removedDetectedSystemIds,
    selectedDomainIds,
    selectedFindingIds,
    selectedPerSystemPlatformIds,
    selectedVendorIds,
    singlePlatformOverride,
    storageKey,
    systemAssetLinks,
    systemOverrides,
    systemVendorLinks,
    vendorOverrides,
  ])

  return {
    hasStarted,
    setHasStarted,
    selectedVendorIds,
    setSelectedVendorIds,
    selectedDomainIds,
    setSelectedDomainIds,
    selectedFindingIds,
    setSelectedFindingIds,
    platformMode,
    setPlatformMode,
    singlePlatformOverride,
    setSinglePlatformOverride,
    selectedPerSystemPlatformIds,
    setSelectedPerSystemPlatformIds,
    perSystemPlatformOverrides,
    setPerSystemPlatformOverrides,
    systemOverrides,
    setSystemOverrides,
    vendorOverrides,
    setVendorOverrides,
    domainOverrides,
    setDomainOverrides,
    findingOverrides,
    setFindingOverrides,
    platformVendorLinks,
    setPlatformVendorLinks,
    platformAssetLinks,
    setPlatformAssetLinks,
    systemVendorLinks,
    setSystemVendorLinks,
    systemAssetLinks,
    setSystemAssetLinks,
    selectedVendorObjects,
    selectedDomainObjects,
    selectedFindingObjects,
    linkOnlyVendors,
    linkOnlyAssets,
    linkVendors,
    linkAssets,
    defaultLinkedVendorIds,
    defaultLinkedAssetIds,
    resolvedSinglePlatformTarget,
    platformTargets,
    displaySystemCandidates,
    resolvedSystemTargets,
    confirmFindings,
    addManualSystem,
    removeSystem,
    persistProgress,
  }
}

export type DomainScanSelection = ReturnType<typeof useDomainScanSelection>
