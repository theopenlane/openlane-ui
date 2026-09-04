import { useMemo } from 'react'
import { type GetEvidenceQuery } from '@repo/codegen/src/schema'
import { type CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import type { Section } from '@/components/shared/object-association/types/object-association-types'
import { getEdgeIds, getLinkedPrograms } from '@/components/shared/object-association/utils'

type EvidenceNode = GetEvidenceQuery['evidence']

export const useEvidenceAssociations = (evidence?: EvidenceNode) => {
  const controlsAndPrograms = useMemo(() => {
    const controls: CustomEvidenceControl[] = evidence?.controls?.edges?.map((edge) => edge?.node).filter((n) => !!n) ?? []
    const subcontrols: CustomEvidenceControl[] = evidence?.subcontrols?.edges?.map((edge) => edge?.node).filter((n) => !!n) ?? []

    return {
      controls,
      subcontrols,
      programs: getLinkedPrograms(evidence?.programs?.edges),
    }
  }, [evidence])

  const initialAssociations = useMemo(
    () => ({
      programIDs: controlsAndPrograms.programs.map(({ id }) => id),
      controlObjectiveIDs: getEdgeIds(evidence?.controlObjectives?.edges),
      subcontrolIDs: getEdgeIds(evidence?.subcontrols?.edges),
      controlIDs: getEdgeIds(evidence?.controls?.edges),
      taskIDs: getEdgeIds(evidence?.tasks?.edges),
    }),
    [evidence, controlsAndPrograms],
  )

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
