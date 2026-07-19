import { useCallback, useMemo } from 'react'
import { useCreateFindingControl, useDeleteFindingControl } from '@/lib/graphql-hooks/finding-control'
import { splitJoinTableInput, type TJoinLinkDiff } from '@/components/shared/object-association/join-table-links'
import { getEdgeNodes } from '@/components/shared/object-association/utils'
import type { TEdgeNode } from '@/components/shared/object-association/types/object-association-types'

export const FINDING_CONTROL_JOIN_KEY_ON_FINDING = 'controlIDs'
export const FINDING_CONTROL_JOIN_KEY_ON_CONTROL = 'findingIDs'

type TMappingConnection<TNode> = { edges?: TEdgeNode<TNode>[] | null } | null | undefined

type TControlMapping = { id: string; controlID: string }
type TFindingMapping = { id: string; findingID: string }

const buildRowIdIndex = <TNode extends { id: string }>(mappings: readonly TNode[], targetKey: (mapping: TNode) => string): Map<string, string[]> => {
  const index = new Map<string, string[]>()
  for (const mapping of mappings) {
    const key = targetKey(mapping)
    const existing = index.get(key)
    if (existing) existing.push(mapping.id)
    else index.set(key, [mapping.id])
  }
  return index
}

const resolveRowIds = (targetIds: readonly string[], rowIdsByTargetId: Map<string, string[]>): string[] => targetIds.flatMap((targetId) => rowIdsByTargetId.get(targetId) ?? [])

const useApplyFindingControlLinks = () => {
  const { mutateAsync: createFindingControl } = useCreateFindingControl()
  const { mutateAsync: deleteFindingControl } = useDeleteFindingControl()

  return useCallback(
    async (creates: readonly { findingID: string; controlID: string }[], deleteRowIds: readonly string[]) => {
      if (creates.length === 0 && deleteRowIds.length === 0) return

      await Promise.all([...creates.map((input) => createFindingControl({ input })), ...deleteRowIds.map((id) => deleteFindingControl({ deleteFindingControlId: id }))])
    },
    [createFindingControl, deleteFindingControl],
  )
}

export const useControlLinksForFinding = (mappingConnection: TMappingConnection<TControlMapping>) => {
  const applyLinks = useApplyFindingControlLinks()
  const rowIdsByControlID = useMemo(() => buildRowIdIndex(getEdgeNodes(mappingConnection?.edges), (mapping) => mapping.controlID), [mappingConnection?.edges])

  return useCallback(
    async (findingID: string, links: TJoinLinkDiff) =>
      applyLinks(
        links.add.filter((controlID) => !rowIdsByControlID.has(controlID)).map((controlID) => ({ findingID, controlID })),
        resolveRowIds(links.remove, rowIdsByControlID),
      ),
    [applyLinks, rowIdsByControlID],
  )
}

export const useFindingLinksForControl = (mappingConnection: TMappingConnection<TFindingMapping>) => {
  const applyLinks = useApplyFindingControlLinks()
  const rowIdsByFindingID = useMemo(() => buildRowIdIndex(getEdgeNodes(mappingConnection?.edges), (mapping) => mapping.findingID), [mappingConnection?.edges])

  return useCallback(
    async (controlID: string, links: TJoinLinkDiff) =>
      applyLinks(
        links.add.filter((findingID) => !rowIdsByFindingID.has(findingID)).map((findingID) => ({ findingID, controlID })),
        resolveRowIds(links.remove, rowIdsByFindingID),
      ),
    [applyLinks, rowIdsByFindingID],
  )
}

export const useUpdateFindingWithControlLinks = ({
  findingID,
  mappingConnection,
  updateFinding,
}: {
  findingID: string | undefined
  mappingConnection: TMappingConnection<TControlMapping>
  updateFinding: (input: object) => Promise<unknown>
}) => {
  const syncControlLinks = useControlLinksForFinding(mappingConnection)

  return useCallback(
    async (input: object) => {
      if (!findingID) return
      const { entityInput, links } = splitJoinTableInput(input, FINDING_CONTROL_JOIN_KEY_ON_FINDING)

      await Promise.all([Object.keys(entityInput).length > 0 ? updateFinding(entityInput) : Promise.resolve(), syncControlLinks(findingID, links)])
    },
    [findingID, updateFinding, syncControlLinks],
  )
}

export const useUpdateControlWithFindingLinks = ({
  controlID,
  mappingConnection,
  updateControl,
}: {
  controlID: string | undefined
  mappingConnection: TMappingConnection<TFindingMapping>
  updateControl: (input: object) => Promise<unknown>
}) => {
  const syncFindingLinks = useFindingLinksForControl(mappingConnection)

  return useCallback(
    async (input: object) => {
      if (!controlID) return
      const { entityInput, links } = splitJoinTableInput(input, FINDING_CONTROL_JOIN_KEY_ON_CONTROL)

      await Promise.all([Object.keys(entityInput).length > 0 ? updateControl(entityInput) : Promise.resolve(), syncFindingLinks(controlID, links)])
    },
    [controlID, updateControl, syncFindingLinks],
  )
}
