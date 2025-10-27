import { GetAllStandardsQuery, GetSuggestedControlsOrSubcontrolsQuery } from '@repo/codegen/src/schema'

export type CustomEvidenceControl = { __typename?: string; id: string; referenceFramework?: string | null; refCode: string }
type CustomEvidenceGroupedItems = {
  refCode: string
  referenceFramework: string | null
}

export type FlattenedControl = {
  id: string
  displayID: string
  refCode: string
  referenceFramework: string | null
  source: string
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

    if (framework === 'CUSTOM') {
      return {
        refCodeIn: refCodes,
        or: [{ referenceFrameworkIsNil: true }],
      }
    }

    return {
      refCodeIn: refCodes,
      or: [{ referenceFramework: framework }],
    }
  })

export const flattenAndFilterControls = (mappedControls: GetSuggestedControlsOrSubcontrolsQuery | undefined, standards: GetAllStandardsQuery | undefined) => {
  if (!mappedControls?.mappedControls?.edges || !standards?.standards?.edges) return []

  const standardNames = new Set(standards.standards.edges.filter((s): s is NonNullable<typeof s> => !!s?.node).map((s) => s.node!.shortName))

  const flattened = mappedControls.mappedControls.edges
    .filter((edge): edge is NonNullable<typeof edge> => !!edge?.node)
    .flatMap((edge) => {
      const node = edge.node!
      const base = { source: node.source }

      const mapEdges = (connection: typeof node.fromControls | typeof node.toControls | typeof node.fromSubcontrols | typeof node.toSubcontrols) =>
        connection?.edges
          ?.filter((e): e is NonNullable<typeof e> => !!e?.node)
          ?.map((e) => e.node!)
          ?.filter((ctrl) => !ctrl.referenceFramework || standardNames.has(ctrl.referenceFramework))
          ?.map((ctrl) => ({
            id: ctrl.id,
            displayID: ctrl.displayID,
            refCode: ctrl.refCode,
            referenceFramework: ctrl.referenceFramework,
            typeName: ctrl.__typename,
            ...base,
          })) ?? []

      return [...mapEdges(node.fromControls), ...mapEdges(node.toControls), ...mapEdges(node.fromSubcontrols), ...mapEdges(node.toSubcontrols)]
    })

  const uniqueControlsMap = new Map<string, (typeof flattened)[number]>()
  flattened.forEach((ctrl) => {
    if (!uniqueControlsMap.has(ctrl.id)) {
      uniqueControlsMap.set(ctrl.id, ctrl)
    }
  })

  return Array.from(uniqueControlsMap.values())
}
