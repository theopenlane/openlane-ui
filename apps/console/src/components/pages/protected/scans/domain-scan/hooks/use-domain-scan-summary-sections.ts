'use client'

import { useMemo } from 'react'
import { getLinkedIds, type LinkMap } from '../selection-utils'
import type { DomainScanSummaryItem, DomainScanSummarySection, LinkableItem, StepId } from '../types'

type UseDomainScanSummarySectionsArgs = {
  stepVisibility: Record<StepId, boolean>
  platforms: DomainScanSummaryItem[]
  systems: DomainScanSummaryItem[]
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
}: UseDomainScanSummarySectionsArgs): DomainScanSummarySection[] =>
  useMemo(() => {
    const vendorNameById = new Map(vendors.map((vendor) => [vendor.id, vendor.name]))
    const withLinkedVendorNames = (items: DomainScanSummaryItem[], vendorLinks: LinkMap, defaultIds: string[]): DomainScanSummaryItem[] =>
      items.map((item) => ({
        ...item,
        linkedVendorNames: Array.from(getLinkedIds(vendorLinks, item.id, defaultIds))
          .map((vendorId) => vendorNameById.get(vendorId))
          .filter((name): name is string => Boolean(name)),
      }))

    const sections: DomainScanSummarySection[] = [
      { stepId: 'platform', title: 'Platforms', items: withLinkedVendorNames(platforms, platformVendorLinks, defaultLinkedVendorIds) },
      { stepId: 'systems', title: 'System Details', items: withLinkedVendorNames(systems, systemVendorLinks, systemDefaultLinkedVendorIds) },
      { stepId: 'vendors', title: 'Vendors', items: vendors },
      { stepId: 'assets', title: 'Assets', items: assets },
      { stepId: 'findings', title: 'Findings', items: findings },
    ]

    return sections.filter((section) => stepVisibility[section.stepId])
  }, [assets, defaultLinkedVendorIds, findings, platformVendorLinks, platforms, stepVisibility, systemDefaultLinkedVendorIds, systemVendorLinks, systems, vendors])
