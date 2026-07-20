import { useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateBulkFindingControl, useBulkDeleteFindingControl, invalidateFindingControlQueries } from '@/lib/graphql-hooks/finding-control'
import { splitJoinTableInput, type TJoinLinkDiff, type TJoinLinkInput } from '@/components/shared/object-association/join-table-links'
import { getEdgeNodes } from '@/components/shared/object-association/utils'
import type { TEdgeNode } from '@/components/shared/object-association/types/object-association-types'

export const FINDING_CONTROL_JOIN_KEY_ON_FINDING = 'controlIDs'
export const FINDING_CONTROL_JOIN_KEY_ON_CONTROL = 'findingIDs'

type TMappingConnection<TNode> = { edges?: TEdgeNode<TNode>[] | null; totalCount?: number } | null | undefined

const isConnectionTruncated = <TNode>(connection: TMappingConnection<TNode>): boolean => {
  const totalCount = connection?.totalCount
  return totalCount != null && getEdgeNodes(connection?.edges).length < totalCount
}

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

const resolveRowIds = (targetIds: readonly string[], rowIdsByTargetId: Map<string, string[]>, mappingsTruncated: boolean): string[] => {
  if (mappingsTruncated && targetIds.some((targetId) => !rowIdsByTargetId.has(targetId))) {
    throw new Error('Some control links could not be loaded; open this item directly and try again')
  }

  return targetIds.flatMap((targetId) => rowIdsByTargetId.get(targetId) ?? [])
}

const useApplyFindingControlLinks = () => {
  const queryClient = useQueryClient()
  const { mutateAsync: createBulkFindingControl } = useCreateBulkFindingControl()
  const { mutateAsync: bulkDeleteFindingControl } = useBulkDeleteFindingControl()

  return useCallback(
    async (creates: readonly { findingID: string; controlID: string }[], deleteRowIds: readonly string[]) => {
      if (creates.length === 0 && deleteRowIds.length === 0) return

      const [deleteOutcome, createOutcome] = await Promise.allSettled([
        deleteRowIds.length > 0 ? bulkDeleteFindingControl({ ids: [...deleteRowIds] }) : undefined,
        creates.length > 0 ? createBulkFindingControl({ input: [...creates] }) : undefined,
      ])

      invalidateFindingControlQueries(queryClient)

      if (deleteOutcome.status === 'rejected') throw deleteOutcome.reason
      if (createOutcome.status === 'rejected') throw createOutcome.reason

      const deletePayload = deleteOutcome.value?.deleteBulkFindingControl
      if (deletePayload && (deletePayload.notDeletedIDs.length > 0 || deletePayload.error)) {
        throw new Error(deletePayload.error ?? `${deletePayload.notDeletedIDs.length} control link(s) could not be removed`)
      }

      const createdCount = createOutcome.value?.createBulkFindingControl?.findingControls?.length ?? creates.length
      if (createdCount !== creates.length) {
        throw new Error(`${creates.length - createdCount} control link(s) could not be created`)
      }
    },
    [createBulkFindingControl, bulkDeleteFindingControl, queryClient],
  )
}

export const useControlLinksForFinding = (mappingConnection: TMappingConnection<TControlMapping>) => {
  const applyLinks = useApplyFindingControlLinks()
  const rowIdsByControlID = useMemo(() => buildRowIdIndex(getEdgeNodes(mappingConnection?.edges), (mapping) => mapping.controlID), [mappingConnection?.edges])
  const mappingsTruncated = isConnectionTruncated(mappingConnection)

  return useCallback(
    async (findingID: string, links: TJoinLinkDiff) =>
      applyLinks(
        links.add.filter((controlID) => !rowIdsByControlID.has(controlID)).map((controlID) => ({ findingID, controlID })),
        resolveRowIds(links.remove, rowIdsByControlID, mappingsTruncated),
      ),
    [applyLinks, rowIdsByControlID, mappingsTruncated],
  )
}

export const useFindingLinksForControl = (mappingConnection: TMappingConnection<TFindingMapping>) => {
  const applyLinks = useApplyFindingControlLinks()
  const rowIdsByFindingID = useMemo(() => buildRowIdIndex(getEdgeNodes(mappingConnection?.edges), (mapping) => mapping.findingID), [mappingConnection?.edges])
  const mappingsTruncated = isConnectionTruncated(mappingConnection)

  return useCallback(
    async (controlID: string, links: TJoinLinkDiff) =>
      applyLinks(
        links.add.filter((findingID) => !rowIdsByFindingID.has(findingID)).map((findingID) => ({ findingID, controlID })),
        resolveRowIds(links.remove, rowIdsByFindingID, mappingsTruncated),
      ),
    [applyLinks, rowIdsByFindingID, mappingsTruncated],
  )
}

export const useUpdateFindingWithControlLinks = <TEntityInput extends object>({
  findingID,
  mappingConnection,
  updateFinding,
}: {
  findingID: string | undefined
  mappingConnection: TMappingConnection<TControlMapping>
  updateFinding: (input: TEntityInput) => Promise<unknown>
}) => {
  const syncControlLinks = useControlLinksForFinding(mappingConnection)

  return useCallback(
    async (input: TEntityInput & TJoinLinkInput<typeof FINDING_CONTROL_JOIN_KEY_ON_FINDING>) => {
      if (!findingID) return
      const { entityInput, links } = splitJoinTableInput(input, FINDING_CONTROL_JOIN_KEY_ON_FINDING)

      await Promise.all([Object.keys(entityInput).length > 0 ? updateFinding(entityInput as TEntityInput) : Promise.resolve(), syncControlLinks(findingID, links)])
    },
    [findingID, updateFinding, syncControlLinks],
  )
}

export const useUpdateControlWithFindingLinks = <TEntityInput extends object>({
  controlID,
  mappingConnection,
  updateControl,
}: {
  controlID: string | undefined
  mappingConnection: TMappingConnection<TFindingMapping>
  updateControl: (input: TEntityInput) => Promise<unknown>
}) => {
  const syncFindingLinks = useFindingLinksForControl(mappingConnection)

  return useCallback(
    async (input: TEntityInput & TJoinLinkInput<typeof FINDING_CONTROL_JOIN_KEY_ON_CONTROL>) => {
      if (!controlID) return
      const { entityInput, links } = splitJoinTableInput(input, FINDING_CONTROL_JOIN_KEY_ON_CONTROL)

      await Promise.all([Object.keys(entityInput).length > 0 ? updateControl(entityInput as TEntityInput) : Promise.resolve(), syncFindingLinks(controlID, links)])
    },
    [controlID, updateControl, syncFindingLinks],
  )
}
