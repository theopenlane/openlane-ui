'use client'

import { useMemo } from 'react'
import { useGetScanAssociations } from '@/lib/graphql-hooks/scan'
import { Panel, PanelHeader } from '@repo/ui/panel'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion'
import { type Section } from '@/components/shared/object-association/types/object-association-types'

type ScanAssociationsSectionProps = {
  scanId?: string
}

export const ScanAssociationsSection = ({ scanId }: ScanAssociationsSectionProps) => {
  const { data: associationsData } = useGetScanAssociations(scanId)

  const sections: Section = useMemo(() => {
    if (!associationsData?.scan) return {}
    const scan = associationsData.scan
    const result: Section = {}

    if (scan.controls?.edges?.length) {
      result['controls'] = {
        edges: scan.controls.edges.map((e) => ({
          node: e?.node ? { id: e.node.id, name: e.node.refCode, displayID: e.node.displayID, refCode: e.node.refCode, description: e.node.description } : null,
        })),
        totalCount: scan.controls.totalCount,
      }
    }

    if (scan.assets?.edges?.length) {
      result['assets'] = {
        edges: scan.assets.edges.map((e) => ({
          node: e?.node ? { id: e.node.id, name: e.node.name, displayID: e.node.displayName ?? '' } : null,
        })),
        totalCount: scan.assets.totalCount,
      }
    }

    if (scan.remediations?.edges?.length) {
      result['remediations'] = {
        edges: scan.remediations.edges.map((e) => ({
          node: e?.node ? { id: e.node.id, name: e.node.title ?? '', displayID: e.node.displayID } : null,
        })),
        totalCount: scan.remediations.totalCount,
      }
    }

    if (scan.tasks?.edges?.length) {
      result['tasks'] = {
        edges: scan.tasks.edges.map((e) => ({
          node: e?.node ? { id: e.node.id, name: e.node.title, displayID: e.node.displayID, title: e.node.title } : null,
        })),
        totalCount: scan.tasks.totalCount,
      }
    }

    if (scan.vulnerabilities?.edges?.length) {
      result['vulnerabilities'] = {
        edges: scan.vulnerabilities.edges.map((e) => ({
          node: e?.node ? { id: e.node.id, name: e.node.displayName ?? '', displayID: e.node.displayID } : null,
        })),
        totalCount: scan.vulnerabilities.totalCount,
      }
    }

    return result
  }, [associationsData])

  const hasSections = Object.values(sections).some((s) => s?.edges?.length)

  if (!hasSections) return null

  return (
    <Panel className="mt-5">
      <PanelHeader heading="Associated Objects" noBorder />
      <AssociatedObjectsAccordion sections={sections} toggleAll={false} removable={false} />
    </Panel>
  )
}
