'use client'

import { useMemo } from 'react'
import { getLinkedIds, type LinkMap } from '../../shared/selection-utils'
import type { EditableStepId, StepId } from '../types'
import type { LinkableItem, ScanSummaryItem, ScanSummarySection } from '../../shared/types'

type UseDomainScanSummarySectionsArgs = {
  stepVisibility: Record<StepId, boolean>
  platforms: ScanSummaryItem[]
  systems: ScanSummaryItem[]
  vendors: LinkableItem[]
  assets: LinkableItem[]
  findings: LinkableItem[]
  platformVendorLinks: LinkMap
  systemVendorLinks: LinkMap
  defaultLinkedVendorIds: string[]
  systemDefaultLinkedVendorIds: string[]
}

export const useDomainScanSummarySections = ({
  stepVisibility,
  platforms,
  systems,
  vendors,
  assets,
  findings,
  platformVendorLinks,
  systemVendorLinks,
  defaultLinkedVendorIds,
  systemDefaultLinkedVendorIds,
}: UseDomainScanSummarySectionsArgs): ScanSummarySection<EditableStepId>[] =>
  useMemo(() => {
    const vendorNameById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]))
    const withLinkedVendorNames = (items: ScanSummaryItem[], vendorLinks: LinkMap, defaultIds: string[]): ScanSummaryItem[] =>
      items.map((item) => ({
        ...item,
        linkedVendorNames: Array.from(getLinkedIds(vendorLinks, item.id, defaultIds))
          .map((vendorId) => vendorNameById.get(vendorId))
          .filter((name): name is string => Boolean(name)),
      }))

    const sections: ScanSummarySection<EditableStepId>[] = [
      { stepId: 'platform', title: 'Platforms', items: withLinkedVendorNames(platforms, platformVendorLinks, defaultLinkedVendorIds) },
      { stepId: 'systems', title: 'System Details', items: withLinkedVendorNames(systems, systemVendorLinks, systemDefaultLinkedVendorIds) },
      { stepId: 'vendors', title: 'Vendors', items: vendors },
      { stepId: 'assets', title: 'Assets', items: assets },
      { stepId: 'findings', title: 'Findings', items: findings },
    ]

    return sections.filter((section) => stepVisibility[section.stepId])
  }, [assets, defaultLinkedVendorIds, findings, platformVendorLinks, platforms, stepVisibility, systemDefaultLinkedVendorIds, systemVendorLinks, systems, vendors])
