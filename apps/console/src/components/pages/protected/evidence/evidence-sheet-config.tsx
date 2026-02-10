import { GetSuggestedControlsOrSubcontrolsQuery, MappedControlWhereInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export type CustomEvidenceControl = { __typename?: string; id: string; referenceFramework?: string | null; refCode: string }
type CustomEvidenceGroupedItems = {
  refCode: string
  referenceFramework: string | null
}

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
  mappingType?: string
  relation?: string
  source?: string
}

export type RefFrameworkGroup = Record<string, CustomEvidenceGroupedItems[]>

export const groupItemsByReferenceFramework = (items: CustomEvidenceControl[] | null): RefFrameworkGroup => {
  if (!items) return {}

  return items.reduce<RefFrameworkGroup>((acc, item) => {
    const key = item.referenceFramework ?? 'CUSTOM'

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push({
      refCode: item.refCode,
      referenceFramework: item.referenceFramework ?? null,
    })

    return acc
  }, {} as RefFrameworkGroup)
}

export const buildOr = (groups: RefFrameworkGroup) =>
  Object.entries(groups).map(([framework, items]) => {
    const refCodes = items.map((i) => i.refCode)

    if (framework === 'CUSTOM' || framework === '') {
      return {
        refCodeIn: refCodes,
        and: [{ referenceFrameworkIsNil: true }],
      }
    }

    return {
      refCodeIn: refCodes,
      and: [{ referenceFramework: framework }],
    }
  })

export const buildWhere = (evidenceControls: CustomEvidenceControl[] | null, evidenceSubcontrols: CustomEvidenceControl[] | null) => {
  const groupedControls = groupItemsByReferenceFramework(evidenceControls)
  const groupedSubcontrols = groupItemsByReferenceFramework(evidenceSubcontrols)
  const or: MappedControlWhereInput[] = []

  if (evidenceControls && evidenceControls.length > 0) {
    or.push({ or: [{ hasFromControlsWith: buildOr(groupedControls) }] })
    or.push({ or: [{ hasToControlsWith: buildOr(groupedControls) }] })
  }

  if (evidenceSubcontrols && evidenceSubcontrols.length > 0) {
    or.push({ or: [{ hasFromSubcontrolsWith: buildOr(groupedSubcontrols) }] })
    or.push({ or: [{ hasToSubcontrolsWith: buildOr(groupedSubcontrols) }] })
  }

  return or.length > 0 ? { or } : undefined
}

export const flattenAndFilterControls = (
  mappedControls: GetSuggestedControlsOrSubcontrolsQuery | undefined,
  evidenceControls: CustomEvidenceControl[] | null,
  evidenceSubcontrols: CustomEvidenceControl[] | null,
): RelatedNode[] => {
  if (!mappedControls?.mappedControls?.edges) return []

  const allowedControlRefCodes = new Set(evidenceControls?.map((ec) => ec.refCode).filter(Boolean) ?? [])
  const allowedSubcontrolRefCodes = new Set(evidenceSubcontrols?.map((ec) => ec.refCode).filter(Boolean) ?? [])

  const result: RelatedNode[] = []

  mappedControls.mappedControls.edges.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    const isFromControl = node.fromControls?.edges?.some((e) => e?.node && allowedControlRefCodes.has(e.node.refCode))
    const isFromSub = node.fromSubcontrols?.edges?.some((e) => e?.node && allowedSubcontrolRefCodes.has(e.node.refCode))
    const isToControl = node.toControls?.edges?.some((e) => e?.node && allowedControlRefCodes.has(e.node.refCode))
    const isToSub = node.toSubcontrols?.edges?.some((e) => e?.node && allowedSubcontrolRefCodes.has(e.node.refCode))

    const oppositeNodes: RelatedNode[] = []

    if (isFromControl || isFromSub) {
      oppositeNodes.push(
        ...(node.toControls?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: ObjectTypes.CONTROL,
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  mappingType: node.source,
                  source: node.source,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
        ...(node.toSubcontrols?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: ObjectTypes.SUBCONTROL,
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  mappingType: node.source,
                  source: node.source,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
      )
    } else if (isToControl || isToSub) {
      oppositeNodes.push(
        ...(node.fromControls?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: ObjectTypes.CONTROL,
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  mappingType: node.source,
                  source: node.source,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
        ...(node.fromSubcontrols?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: ObjectTypes.SUBCONTROL,
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  mappingType: node.source,
                  source: node.source,
                }
              : null,
          )
          .filter(Boolean) as RelatedNode[]),
      )
    }

    result.push(...oppositeNodes)
  })

  return result
}
