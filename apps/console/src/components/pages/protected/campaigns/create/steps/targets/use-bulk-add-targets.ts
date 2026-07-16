'use client'

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { BULK_ADD_LIMIT, hasTarget, mergeTargets, type CampaignTargetEntry } from './target-entry'

interface UseBulkAddTargetsArgs<TWhere, TNode> {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
  where: TWhere
  entityLabel: string
  fetchAll: (where: TWhere, first: number) => Promise<{ nodes: TNode[]; totalCount: number }>
  toTargets: (node: TNode) => CampaignTargetEntry[]
}

export const useBulkAddTargets = <TWhere, TNode>({ targets, onTargetsChange, where, entityLabel, fetchAll, toTargets }: UseBulkAddTargetsArgs<TWhere, TNode>) => {
  const [isAddingAll, setIsAddingAll] = useState(false)
  const isFetchingRef = useRef(false)
  const { successNotification, warningNotification, errorNotification } = useNotification()

  const addAll = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setIsAddingAll(true)
    try {
      const { nodes, totalCount } = await fetchAll(where, BULK_ADD_LIMIT)
      const incoming = nodes.flatMap(toTargets)

      onTargetsChange((current) => mergeTargets(current, incoming))
      const addedCount = incoming.filter((target) => !hasTarget(targets, target.email)).length

      if (totalCount > incoming.length) {
        warningNotification({
          title: `Added ${addedCount} of ${totalCount} matching ${entityLabel}`,
          description: `Only ${BULK_ADD_LIMIT} recipients can be added at once. Narrow the filter to add the rest.`,
        })
      } else {
        successNotification({ title: `Added ${addedCount} ${entityLabel}` })
      }
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      isFetchingRef.current = false
      setIsAddingAll(false)
    }
  }, [fetchAll, where, toTargets, targets, onTargetsChange, entityLabel, successNotification, warningNotification, errorNotification])

  return { addAll, isAddingAll }
}
