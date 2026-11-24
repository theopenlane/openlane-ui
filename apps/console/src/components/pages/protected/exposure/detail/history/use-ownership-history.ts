import { useCallback, useMemo } from 'react'
import { resolveAuthor } from '@/lib/authors'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useGetGroupNames } from '@/lib/graphql-hooks/group'
import { useIdentityHolderOptions } from '@/lib/graphql-hooks/identity-holder'
import { buildOwnershipChanges, historyReferencedIds, type TOwnershipHistoryNode } from './history-events'

type TUseOwnershipHistoryArgs<TOp extends string> = {
  histories: TOwnershipHistoryNode<TOp>[]
  updateOperation: TOp
  authorIds: Array<string | null | undefined>
  isPending: boolean
}

export const useOwnershipHistory = <TOp extends string>({ histories, updateOperation, authorIds, isPending }: TUseOwnershipHistoryArgs<TOp>) => {
  const { userIds, groupIds, personnelIds } = useMemo(() => historyReferencedIds(histories), [histories])
  const { authorMaps } = useAuthorMaps(isPending ? [] : [...userIds, ...authorIds])
  const groupWhere = useMemo(() => ({ idIn: groupIds }), [groupIds])
  const { groups } = useGetGroupNames({ where: groupWhere, enabled: groupIds.length > 0 })
  const personnelWhere = useMemo(() => ({ idIn: personnelIds }), [personnelIds])
  const { nodes: personnel } = useIdentityHolderOptions({ where: personnelWhere, enabled: personnelIds.length > 0 })

  const authorName = useCallback(
    (id: string | null | undefined) => {
      const author = resolveAuthor(id, authorMaps)
      return author.kind === 'unknown' || author.kind === 'unresolved' ? null : author.displayName
    },
    [authorMaps],
  )

  const ownershipChanges = useMemo(() => {
    const groupNames = new Map(groups.map((group) => [group.id, group.displayName || group.name]))
    const personnelNames = new Map(personnel.map((person) => [person.id, person.fullName || person.email || person.id]))
    return buildOwnershipChanges(histories, updateOperation, (kind, id) => {
      if (kind === 'group') return groupNames.get(id) ?? 'a group'
      if (kind === 'personnel') return personnelNames.get(id) ?? 'a person'
      return authorName(id) ?? 'a user'
    })
  }, [histories, updateOperation, groups, personnel, authorName])

  return { authorName, ownershipChanges }
}
