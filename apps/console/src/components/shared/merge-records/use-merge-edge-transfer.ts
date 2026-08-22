'use client'

import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { MERGEABLE_EDGES_BY_TYPE, SINGLE_RECORD_QUERY_FIELD_BY_TYPE, type MergeEdgeDescriptor, type MergeableEdgeNamesFor, type MergeableTypeName } from '@repo/codegen/src/merge-fields.generated'
import { fetchEdgeIdsByEdgeName } from './edge-ids-query'
import { humanizeKey } from './build-fields'
import type { MergeEdgeTransferCount } from './types'

export type MergeAddKeysFor<TEntity extends MergeableTypeName> = (typeof MERGEABLE_EDGES_BY_TYPE)[TEntity][number]['addKey']

export type MergeRemoveKeysFor<TEntity extends MergeableTypeName> = Exclude<(typeof MERGEABLE_EDGES_BY_TYPE)[TEntity][number]['removeKey'], null>

export type MergeEdgeAddInput<TEntity extends MergeableTypeName> = Partial<Record<MergeAddKeysFor<TEntity>, string[]>>

export type MergeEdgeRemoveInput<TEntity extends MergeableTypeName> = Partial<Record<MergeRemoveKeysFor<TEntity>, string[]>>

export type MergeEdgeInputs<TEntity extends MergeableTypeName> = {
  addInput: MergeEdgeAddInput<TEntity>
  removeInput: MergeEdgeRemoveInput<TEntity>
}

export type MergeEdgeTransferResult<TEntity extends MergeableTypeName> = {
  counts: MergeEdgeTransferCount[]
  isLoading: boolean
  error: unknown
  hasAclEdges: boolean
  readLatestEdgeInputs: () => Promise<MergeEdgeInputs<TEntity>>
}

type Args<TEntity extends MergeableTypeName> = {
  entityType: TEntity
  primaryId: string
  secondaryId: string | null
  excludeEdges?: ReadonlyArray<MergeableEdgeNamesFor<TEntity>>
}

export const useMergeEdgeTransfer = <TEntity extends MergeableTypeName>({ entityType, primaryId, secondaryId, excludeEdges }: Args<TEntity>): MergeEdgeTransferResult<TEntity> => {
  const { client, queryClient } = useGraphQLClient()

  const queryField: string | null = SINGLE_RECORD_QUERY_FIELD_BY_TYPE[entityType]
  const allEdges: readonly MergeEdgeDescriptor[] = MERGEABLE_EDGES_BY_TYPE[entityType]

  const transferableEdges = useMemo(() => {
    const excluded = new Set<string>(excludeEdges ?? [])
    return allEdges.filter((descriptor) => !descriptor.acl && !excluded.has(descriptor.name))
  }, [allEdges, excludeEdges])

  const edgeNames = useMemo(() => transferableEdges.map((descriptor) => descriptor.name), [transferableEdges])

  const queryKey = useMemo(() => ['mergeEdgeIds', entityType, secondaryId, edgeNames], [entityType, secondaryId, edgeNames])

  const readEdgeIds = useCallback(() => {
    if (queryField === null) throw new Error(`No single-record query exists for ${entityType}; its linked records cannot be read.`)
    if (secondaryId === null) throw new Error('No secondary record is selected.')
    return fetchEdgeIdsByEdgeName(client, queryField, edgeNames, secondaryId)
  }, [client, edgeNames, entityType, queryField, secondaryId])

  const { data, isFetching, isPlaceholderData, error } = useQuery({
    queryKey,
    queryFn: readEdgeIds,
    enabled: queryField !== null && secondaryId !== null && edgeNames.length > 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })

  const toEdgeInputs = useCallback(
    (edgeIds: Map<string, string[]>) => {
      const addInput: Record<string, string[]> = {}
      const removeInput: Record<string, string[]> = {}
      const counts: MergeEdgeTransferCount[] = []

      for (const descriptor of transferableEdges) {
        const ids = (edgeIds.get(descriptor.name) ?? []).filter((id) => id !== primaryId)
        if (ids.length === 0) continue
        addInput[descriptor.addKey] = ids
        if (descriptor.removeKey) removeInput[descriptor.removeKey] = ids
        counts.push({ key: descriptor.name, label: humanizeKey(descriptor.name), count: ids.length })
      }

      return { addInput: addInput as MergeEdgeAddInput<TEntity>, removeInput: removeInput as MergeEdgeRemoveInput<TEntity>, counts }
    },
    [primaryId, transferableEdges],
  )

  const counts = useMemo(() => (data ? toEdgeInputs(data).counts : []), [data, toEdgeInputs])

  const readLatestEdgeInputs = useCallback(async () => {
    const { addInput, removeInput } = toEdgeInputs(await queryClient.fetchQuery({ queryKey, queryFn: readEdgeIds, staleTime: 0, gcTime: 0 }))
    return { addInput, removeInput }
  }, [queryClient, queryKey, readEdgeIds, toEdgeInputs])

  const unreadableType = secondaryId !== null && queryField === null

  return {
    counts,
    isLoading: secondaryId !== null && !unreadableType && edgeNames.length > 0 && (isFetching || isPlaceholderData),
    error: unreadableType ? new Error(`Linked records cannot be read for ${entityType}.`) : error,
    hasAclEdges: allEdges.some((descriptor) => descriptor.acl),
    readLatestEdgeInputs,
  }
}
