import { useMemo } from 'react'
import { type Control, type GetEvidenceQuery, type Subcontrol } from '@repo/codegen/src/schema'
import type { Section } from '@/components/shared/object-association/types/object-association-types'

type EvidenceNode = GetEvidenceQuery['evidence']

type NodeIdEdge = { node?: { id?: string | null } | null } | null

const nodeIds = (edges?: readonly NodeIdEdge[] | null): string[] => edges?.map((edge) => edge?.node?.id).filter((id): id is string => typeof id === 'string' && id.length > 0) ?? []

export const useEvidenceAssociations = (evidence?: EvidenceNode) => {
  const initialAssociations = useMemo(
    () => ({
      programIDs: nodeIds(evidence?.programs?.edges),
      controlObjectiveIDs: nodeIds(evidence?.controlObjectives?.edges),
      subcontrolIDs: nodeIds(evidence?.subcontrols?.edges),
      controlIDs: nodeIds(evidence?.controls?.edges),
      taskIDs: nodeIds(evidence?.tasks?.edges),
    }),
    [evidence],
  )

  const controlsAndPrograms = useMemo(() => {
    const controls: Control[] = evidence?.controls?.edges?.map((edge) => edge?.node).filter((n): n is Control => !!n) ?? []
    const subcontrols: Subcontrol[] = evidence?.subcontrols?.edges?.map((edge) => edge?.node).filter((n): n is Subcontrol => !!n) ?? []

    return {
      controls,
      subcontrols,
      programDisplayIDs: evidence?.programs?.edges?.map((edge) => edge?.node?.name).filter((name): name is string => typeof name === 'string' && name.length > 0) ?? [],
    }
  }, [evidence])

  const associatedObjectSections = useMemo<Section>(() => {
    if (!evidence) return {}
    const sections: Section = {}
    if (evidence.tasks?.edges?.length) sections.tasks = evidence.tasks
    if (evidence.controlObjectives?.edges?.length) sections.controlObjectives = evidence.controlObjectives
    if (evidence.controlImplementations?.edges?.length) {
      sections.controlImplementations = {
        totalCount: evidence.controlImplementations.totalCount,
        edges: evidence.controlImplementations.edges.map((edge) => {
          if (!edge?.node?.id) return edge
          const refCode = edge.node.controls?.edges?.[0]?.node?.refCode
          return {
            node: {
              id: edge.node.id,
              details: edge.node.details,
              name: refCode ? `Control ${refCode} - Control Implementation` : (edge.node.details?.slice(0, 50) ?? ''),
            },
          }
        }),
      }
    }
    if (evidence.scans?.edges?.length) sections.scans = evidence.scans
    return sections
  }, [evidence])

  return { initialAssociations, controlsAndPrograms, associatedObjectSections }
}
