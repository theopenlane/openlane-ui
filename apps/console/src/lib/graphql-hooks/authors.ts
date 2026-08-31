import { useCallback, useMemo } from 'react'
import { type GetApiTokensByIdsQuery, type OrgMembershipsByIdsQuery, type User } from '@repo/codegen/src/schema'
import { GET_ORG_USER_LIST } from '@repo/codegen/query/member'
import { GET_API_TOKENS_BY_IDS } from '@repo/codegen/query/tokens'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { toOrgUserList, useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens'
import { type AuthorMaps, type AuthorToken, SUPPORT_SUBJECT_ID } from '@/lib/authors'
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

const AUTHOR_LOOKUP_CHUNK_SIZE = 100

const chunk = <T>(items: T[], size: number): T[][] => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size))

export const useFetchAuthorMaps = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    async (ids: Array<string | null | undefined>): Promise<AuthorMaps> => {
      const authorIds = Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0 && isUlid(id))))

      if (authorIds.length === 0) {
        return { userMap: {}, tokenMap: {} }
      }

      const tokenIds = authorIds.filter((id) => id !== SUPPORT_SUBJECT_ID)

      const [userResults, tokenResults] = await Promise.all([
        Promise.all(chunk(authorIds, AUTHOR_LOOKUP_CHUNK_SIZE).map((idIn) => client.request<OrgMembershipsByIdsQuery>(GET_ORG_USER_LIST, { where: { hasUserWith: [{ idIn }] } }))),
        Promise.all(chunk(tokenIds, AUTHOR_LOOKUP_CHUNK_SIZE).map((idIn) => client.request<GetApiTokensByIdsQuery>(GET_API_TOKENS_BY_IDS, { where: { idIn } }))),
      ])

      const userMap: Record<string, User> = {}
      userResults.forEach((result) => {
        toOrgUserList(result, authorIds).forEach((user) => {
          if (user?.id) userMap[user.id] = user
        })
      })

      const tokenMap: Record<string, AuthorToken> = {}
      tokenResults.forEach((result) => {
        result.apiTokens?.edges?.forEach((edge) => {
          if (edge?.node?.id) tokenMap[edge.node.id] = edge.node
        })
      })

      return { userMap, tokenMap }
    },
    [client],
  )
}
