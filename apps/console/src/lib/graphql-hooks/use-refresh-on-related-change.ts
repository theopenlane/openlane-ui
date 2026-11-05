import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const RELATED_RECORD_SECTION = 'record'

export const exposureRelatedSections = (commentsKey: string): Readonly<Record<string, readonly string[]>> => ({
  tasks: ['associations', 'remediation-work', 'history-edges'],
  remediations: [RELATED_RECORD_SECTION, 'associations', 'remediation-work', 'history-edges'],
  actionPlans: ['associations', 'remediation-work'],
  assets: ['associations', 'history-edges'],
  reviews: ['associations', 'history-edges'],
  [commentsKey]: ['history-edges'],
})

export const useRefreshOnRelatedChange = (rootKey: string, entityId: string | undefined, relatedSections: Readonly<Record<string, readonly string[]>>) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!entityId) return
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'invalidate') return
      const [root] = event.query.queryKey
      const sections = typeof root === 'string' && Object.hasOwn(relatedSections, root) ? relatedSections[root] : []
      sections.forEach((section) =>
        queryClient.invalidateQueries(section === RELATED_RECORD_SECTION ? { queryKey: [rootKey, entityId], exact: true } : { queryKey: [rootKey, entityId, section] }, { cancelRefetch: false }),
      )
    })
  }, [queryClient, rootKey, entityId, relatedSections])
}
