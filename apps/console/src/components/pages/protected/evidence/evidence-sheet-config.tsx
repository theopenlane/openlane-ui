import { type GetAllMappedControlsQuery, MappedControlMappingSource, type MappedControlWhereInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export const EVIDENCE_ASSOCIATION_FIELDS = [
  'controlObjectiveIDs',
  'subcontrolIDs',
  'programIDs',
  'controlIDs',
  'taskIDs',
  'evidenceIDs',
  'groupIDs',
  'internalPolicyIDs',
  'procedureIDs',
  'riskIDs',
] as const

export type EvidenceAssociationField = (typeof EVIDENCE_ASSOCIATION_FIELDS)[number]

export type CustomEvidenceControl = { __typename?: string; id: string; referenceFramework?: string | null; refCode: string }

export type FlattenedControl = {
  id: string
  refCode: string
  referenceFramework: string | null
  source: string
}

type RelatedNode = {
  type: typeof ObjectTypes.CONTROL | typeof ObjectTypes.SUBCONTROL
  id: string
  refCode: string
  referenceFramework: string | null
  controlId?: string
  mappingType: MappedControlMappingSource | null
  relation?: string
  source: MappedControlMappingSource | null
}

export const buildWhere = (evidenceControls: CustomEvidenceControl[] | null, evidenceSubcontrols: CustomEvidenceControl[] | null) => {
  const or: MappedControlWhereInput[] = []

  if (evidenceControls && evidenceControls.length > 0) {
    for (const control of evidenceControls) {
      or.push({
        and: [
          { source: MappedControlMappingSource.SUGGESTED },
          {
            hasFromControlsWith: [
              control.referenceFramework ? { refCode: control.refCode, referenceFramework: control.referenceFramework } : { refCode: control.refCode, referenceFrameworkIsNil: true },
            ],
          },
        ],
      })
      or.push({
        hasFromControlsWith: [{ id: control.id }],
      })
    }
  }

  if (evidenceSubcontrols && evidenceSubcontrols.length > 0) {
    for (const subcontrol of evidenceSubcontrols) {
      or.push({
        and: [
          { source: MappedControlMappingSource.SUGGESTED },
          {
            hasFromSubcontrolsWith: [
              subcontrol.referenceFramework ? { refCode: subcontrol.refCode, referenceFramework: subcontrol.referenceFramework } : { refCode: subcontrol.refCode, referenceFrameworkIsNil: true },
            ],
          },
        ],
      })
      or.push({
        hasFromSubcontrolsWith: [{ id: subcontrol.id }],
      })
    }
  }

  return or.length > 0 ? { or } : undefined
}

export const flattenAndFilterControls = (
  mappedControls: GetAllMappedControlsQuery | undefined,
  evidenceControls: CustomEvidenceControl[] | null,
  evidenceSubcontrols: CustomEvidenceControl[] | null,
): RelatedNode[] => {
  if (!mappedControls?.mappedControls?.edges) return []

  const evidenceControlIds = new Set(evidenceControls?.map((ec) => ec.id) ?? [])
  const evidenceSubcontrolIds = new Set(evidenceSubcontrols?.map((ec) => ec.id) ?? [])

  const result: RelatedNode[] = []

  mappedControls.mappedControls.edges.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    node.toControls?.edges?.forEach((e) => {
      if (!e?.node) return
      if (evidenceControlIds.has(e.node.id)) return
      result.push({
        type: ObjectTypes.CONTROL,
        id: e.node.id,
        refCode: e.node.refCode,
        referenceFramework: e.node.referenceFramework ?? null,
        mappingType: node.source ?? null,
        source: node.source ?? null,
      })
    })

    node.toSubcontrols?.edges?.forEach((e) => {
      if (!e?.node) return
      if (evidenceSubcontrolIds.has(e.node.id)) return
      result.push({
        type: ObjectTypes.SUBCONTROL,
        id: e.node.id,
        refCode: e.node.refCode,
        referenceFramework: e.node.referenceFramework ?? null,
        mappingType: node.source ?? null,
        source: node.source ?? null,
      })
    })
  })

  return result
}
