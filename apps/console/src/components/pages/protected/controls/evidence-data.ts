import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { getEdgeIds, getLinkedPrograms } from '@/components/shared/object-association/utils'

type EdgeNode = {
  id?: string | null
  name?: string | null
}

type Edge = { node?: EdgeNode | null } | null

type ProgramEdge = { node?: { id: string; name: string; displayID?: string | null } | null } | null

type ControlObjectiveEdges = {
  edges?: Edge[] | null
} | null

type ControlLike = {
  id?: string | null
  referenceFramework?: string | null
  refCode?: string | null
  controlObjectives?: ControlObjectiveEdges
} | null

type SubcontrolLike = {
  id?: string | null
  referenceFramework?: string | null
  refCode?: string | null
  controlObjectives?: ControlObjectiveEdges
} | null

export const buildEvidenceControlParam = (control?: ControlLike) => ({
  id: control?.id ?? '',
  referenceFramework: {
    [control?.id ?? 'default']: control?.referenceFramework ?? '',
  },
  controlRefCodes: control?.refCode ? [control.refCode] : [],
})

export const buildControlEvidenceData = (control: ControlLike, associationsData?: { control?: { programs?: { edges?: ProgramEdge[] | null } | null } | null }): TFormEvidenceData => {
  const programEdges = associationsData?.control?.programs?.edges
  const controlObjectiveEdges = control?.controlObjectives?.edges as Edge[] | null | undefined
  const linkedPrograms = getLinkedPrograms(programEdges)

  return {
    displayID: control?.refCode ?? undefined,
    controlID: control?.id ?? undefined,
    controlRefCodes: control?.refCode ? [control.refCode] : [],
    referenceFramework: {
      [control?.id ?? 'default']: control?.referenceFramework ?? '',
    },
    linkedPrograms,
    objectAssociations: {
      controlIDs: control?.id ? [control.id] : [],
      programIDs: linkedPrograms.map(({ id }) => id),
      controlObjectiveIDs: getEdgeIds(controlObjectiveEdges),
    },
  }
}

export const buildSubcontrolEvidenceData = (subcontrol: SubcontrolLike): TFormEvidenceData => {
  const controlObjectiveEdges = subcontrol?.controlObjectives?.edges as Edge[] | null | undefined

  return {
    displayID: subcontrol?.refCode ?? undefined,
    subcontrolID: subcontrol?.id ?? undefined,
    subcontrolRefCodes: subcontrol?.refCode ? [subcontrol.refCode] : [],
    subcontrolReferenceFramework: {
      [subcontrol?.id ?? 'default']: subcontrol?.referenceFramework ?? '',
    },
    objectAssociations: {
      subcontrolIDs: subcontrol?.id ? [subcontrol.id] : [],
      controlObjectiveIDs: getEdgeIds(controlObjectiveEdges),
    },
  }
}
