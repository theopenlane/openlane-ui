import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import { getEdgeIds, getEdgeNames, getEdgeDisplayIds } from '@/components/shared/object-association/utils'

type EdgeNode = {
  id?: string | null
  name?: string | null
  displayID?: string | null
}

type Edge = { node?: EdgeNode | null } | null

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

export const buildControlEvidenceData = (control: ControlLike, associationsData?: { control?: { programs?: { edges?: Edge[] | null } | null } | null }): TFormEvidenceData => {
  const programEdges = associationsData?.control?.programs?.edges
  const controlObjectiveEdges = control?.controlObjectives?.edges as Edge[] | null | undefined

  return {
    displayID: control?.refCode ?? undefined,
    controlID: control?.id ?? undefined,
    controlRefCodes: control?.refCode ? [control.refCode] : [],
    referenceFramework: {
      [control?.id ?? 'default']: control?.referenceFramework ?? '',
    },
    programDisplayIDs: getEdgeNames(programEdges),
    objectAssociations: {
      controlIDs: control?.id ? [control.id] : [],
      programIDs: getEdgeIds(programEdges),
      controlObjectiveIDs: getEdgeIds(controlObjectiveEdges),
    },
    objectAssociationsDisplayIDs: [...getEdgeDisplayIds(programEdges), ...getEdgeDisplayIds(controlObjectiveEdges), ...(control?.refCode ? [control.refCode] : [])],
  }
}

export const buildSubcontrolEvidenceData = (subcontrol: SubcontrolLike, associationsData?: { subcontrol?: { tasks?: { edges?: Edge[] | null } | null } | null }): TFormEvidenceData => {
  const taskEdges = associationsData?.subcontrol?.tasks?.edges
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
    objectAssociationsDisplayIDs: [...getEdgeDisplayIds(taskEdges), ...getEdgeDisplayIds(controlObjectiveEdges), ...(subcontrol?.refCode ? [subcontrol.refCode] : [])],
  }
}
