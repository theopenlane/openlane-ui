import { useCallback } from 'react'
import { QueryClient } from '@tanstack/react-query'

type CacheTarget = {
  queryKey: readonly unknown[]
  dataRootField: string
  exact?: boolean
}

type AssociationRemovalConfig<TInput extends object, TSectionKey extends string, TDataField extends string> = {
  entityId: string | undefined
  handleUpdateField: (input: TInput) => Promise<void>
  queryClient: QueryClient
  cacheTargets: CacheTarget[]
  invalidateQueryKeys?: readonly (readonly unknown[])[]
  sectionKeyToRemoveField: Record<TSectionKey, Extract<keyof TInput, string>>
  sectionKeyToDataField: Record<TSectionKey, TDataField>
  sectionKeyToInvalidateQueryKey?: Partial<Record<TSectionKey, readonly unknown[]>>
  onRemoved?: () => void
}

type TRecord = Record<string, unknown>

const isRecord = (value: unknown): value is TRecord => {
  return typeof value === 'object' && value !== null
}

const getNodeId = (edge: unknown): string | undefined => {
  if (!isRecord(edge)) return undefined

  const node = edge.node
  if (!isRecord(node)) return undefined

  const id = node.id
  return typeof id === 'string' ? id : undefined
}

const buildRemovalInput = <TInput extends object, TField extends Extract<keyof TInput, string>>(field: TField, objectId: string): TInput => {
  return { [field]: [objectId] } as TInput
}

export function useAssociationRemoval<TInput extends object, TSectionKey extends string, TDataField extends string>({
  entityId,
  handleUpdateField,
  queryClient,
  cacheTargets,
  invalidateQueryKeys,
  sectionKeyToRemoveField,
  sectionKeyToDataField,
  sectionKeyToInvalidateQueryKey,
  onRemoved,
}: AssociationRemovalConfig<TInput, TSectionKey, TDataField>) {
  return useCallback(
    async (objectId: string, kind: string) => {
      const isSectionKey = (value: string): value is TSectionKey => {
        return value in sectionKeyToRemoveField && value in sectionKeyToDataField
      }

      if (!isSectionKey(kind) || !entityId) return

      const removeField = sectionKeyToRemoveField[kind]
      const dataField = sectionKeyToDataField[kind]

      try {
        await handleUpdateField(buildRemovalInput(removeField, objectId))
      } catch {
        return
      }

      for (const { queryKey, dataRootField, exact = true } of cacheTargets) {
        const updateCachedData = (oldData: unknown) => {
          if (!isRecord(oldData)) return oldData

          const rootNode = oldData[dataRootField]
          if (!isRecord(rootNode)) return oldData

          // When matching by prefix, guard against mutating other entities' cache entries.
          const rootNodeId = rootNode.id
          if (typeof rootNodeId === 'string' && rootNodeId !== entityId) return oldData

          const section = rootNode[dataField]
          if (!isRecord(section)) return oldData

          const edges = section.edges
          if (!Array.isArray(edges)) return oldData

          const nextEdges = edges.filter((edge) => getNodeId(edge) !== objectId)
          const removedCount = edges.length - nextEdges.length
          if (removedCount === 0) return oldData

          const totalCount = typeof section.totalCount === 'number' ? section.totalCount : edges.length

          return {
            ...oldData,
            [dataRootField]: {
              ...rootNode,
              [dataField]: {
                ...section,
                totalCount: Math.max(0, totalCount - removedCount),
                edges: nextEdges,
              },
            },
          }
        }

        if (!exact) {
          queryClient.setQueriesData({ queryKey, exact: false }, updateCachedData)
        } else {
          queryClient.setQueryData(queryKey, updateCachedData)
        }
      }

      if (invalidateQueryKeys?.length) {
        for (const queryKey of invalidateQueryKeys) {
          queryClient.invalidateQueries({ queryKey })
        }
      }

      const relatedQueryKey = sectionKeyToInvalidateQueryKey?.[kind]
      if (relatedQueryKey) {
        queryClient.invalidateQueries({ queryKey: relatedQueryKey })
      }

      onRemoved?.()
    },
    [entityId, handleUpdateField, queryClient, cacheTargets, invalidateQueryKeys, sectionKeyToRemoveField, sectionKeyToDataField, sectionKeyToInvalidateQueryKey, onRemoved],
  )
}
