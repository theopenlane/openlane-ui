import { useMemo } from 'react'
import { type User } from '@repo/codegen/src/schema'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens'
import { type AuthorToken, SUPPORT_SUBJECT_ID } from '@/lib/authors'
import { isUlid } from '@/lib/validators'

export const useAuthorMaps = (ids: Array<string | null | undefined>) => {
  const authorIdsKey = Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0 && isUlid(id))))
    .sort()
    .join(',')
  const authorIds = useMemo(() => (authorIdsKey ? authorIdsKey.split(',') : []), [authorIdsKey])
  const tokenIds = useMemo(() => authorIds.filter((id) => id !== SUPPORT_SUBJECT_ID), [authorIds])

  const userWhere = useMemo(() => ({ hasUserWith: [{ idIn: authorIds }] }), [authorIds])
  const tokenWhere = useMemo(() => ({ idIn: tokenIds }), [tokenIds])

  const { users, isFetching: isFetchingUsers } = useGetOrgUserList({ where: userWhere })
  const { tokens, isFetching: isFetchingTokens } = useGetApiTokensByIds({ where: tokenWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      if (user?.id) map[user.id] = user
    })
    return map
  }, [users])

  const tokenMap = useMemo(() => {
    const map: Record<string, AuthorToken> = {}
    tokens?.forEach((token) => {
      if (token?.id) map[token.id] = token
    })
    return map
  }, [tokens])

  return { userMap, tokenMap, isLoading: isFetchingUsers || isFetchingTokens }
}
