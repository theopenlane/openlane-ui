import { useMemo } from 'react'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { useGetExistingOrgControls } from '@/lib/graphql-hooks/control'

const OTS_REFERENCE_FRAMEWORK = 'OTS'

const comboKey = (refCode: string, referenceFramework?: string | null) => `${refCode}::${referenceFramework ?? 'CUSTOM'}`

export const useRecommendedTrustCenterControls = (): { recommendedRefCodes: Set<string> } => {
  const { data: recommendedMappedControls } = useGetMappedControls({
    where: { hasFromControlsWith: [{ referenceFramework: OTS_REFERENCE_FRAMEWORK }] },
  })

  const { mappings, toRefCodes } = useMemo(() => {
    const mappingList: { fromRefCodes: string[]; toComboKeys: string[] }[] = []
    const refCodeSet = new Set<string>()

    for (const edge of recommendedMappedControls?.mappedControls?.edges ?? []) {
      const node = edge?.node
      if (!node) continue

      const fromRefCodes: string[] = []
      for (const fromEdge of node.fromControls?.edges ?? []) {
        if (fromEdge?.node?.refCode) fromRefCodes.push(fromEdge.node.refCode)
      }

      const toComboKeys: string[] = []
      for (const toEdge of node.toControls?.edges ?? []) {
        const toNode = toEdge?.node
        if (!toNode?.refCode) continue
        toComboKeys.push(comboKey(toNode.refCode, toNode.referenceFramework))
        refCodeSet.add(toNode.refCode)
      }

      if (fromRefCodes.length && toComboKeys.length) {
        mappingList.push({ fromRefCodes, toComboKeys })
      }
    }

    return { mappings: mappingList, toRefCodes: Array.from(refCodeSet) }
  }, [recommendedMappedControls])

  const { data: approvedOrgControls } = useGetExistingOrgControls({
    refCodeIn: toRefCodes,
    statusIn: [ControlControlStatus.APPROVED],
  })

  const recommendedRefCodes = useMemo(() => {
    const approvedComboKeys = new Set<string>()
    for (const edge of approvedOrgControls?.controls?.edges ?? []) {
      const node = edge?.node
      if (node?.refCode) approvedComboKeys.add(comboKey(node.refCode, node.referenceFramework))
    }

    const refCodes = new Set<string>()
    for (const mapping of mappings) {
      if (mapping.toComboKeys.some((key) => approvedComboKeys.has(key))) {
        for (const refCode of mapping.fromRefCodes) refCodes.add(refCode)
      }
    }
    return refCodes
  }, [approvedOrgControls, mappings])

  return { recommendedRefCodes }
}
