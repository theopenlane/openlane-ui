import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type GetApiTokensByIdsQuery, type OrgMembershipsByIdsQuery, type User } from '@repo/codegen/src/schema'
import { GET_ORG_USER_LIST } from '@repo/codegen/query/member'
import { GET_API_TOKENS_BY_IDS } from '@repo/codegen/query/tokens'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { toOrgUserList, useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens'
import { integrationProvidersQueryOptions } from '@/lib/query-hooks/integrations'
import { type AuthorLookupStatus, type AuthorMaps, type AuthorToken, INTEGRATION_SUBJECT_ID, SUPPORT_SUBJECT_ID } from '@/lib/authors'
import { isUlid } from '@/lib/validators'
import { chunk } from '@/utils/async'

const VIRTUAL_SUBJECT_IDS = new Set([SUPPORT_SUBJECT_ID, INTEGRATION_SUBJECT_ID])

const isAwaitingLookup = (query: { isPending: boolean; isPlaceholderData: boolean }, ids: string[]) => ids.length > 0 && (query.isPending || query.isPlaceholderData)

const toAuthorIds = (ids: Array<string | null | undefined>) => Array.from(new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0 && isUlid(id))))

const toTokenIds = (authorIds: string[]) => authorIds.filter((id) => !VIRTUAL_SUBJECT_IDS.has(id))

export const useAuthorMaps = (ids: Array<string | null | undefined>) => {
  const authorIdsKey = toAuthorIds(ids).sort().join(',')
  const authorIds = useMemo(() => (authorIdsKey ? authorIdsKey.split(',') : []), [authorIdsKey])
  const tokenIds = useMemo(() => toTokenIds(authorIds), [authorIds])
  const needsProviders = authorIds.includes(INTEGRATION_SUBJECT_ID)

  const userWhere = useMemo(() => ({ hasUserWith: [{ idIn: authorIds }] }), [authorIds])
  const tokenWhere = useMemo(() => ({ idIn: tokenIds }), [tokenIds])

  const userQuery = useGetOrgUserList({ where: userWhere })
  const tokenQuery = useGetApiTokensByIds({ where: tokenWhere })
  const providerQuery = useQuery({ ...integrationProvidersQueryOptions, enabled: needsProviders })
  const { users } = userQuery
  const { tokens } = tokenQuery
  const providers = providerQuery.data?.providers

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

  const status: AuthorLookupStatus =
    userQuery.isLoadingError || tokenQuery.isLoadingError
      ? 'error'
      : isAwaitingLookup(userQuery, authorIds) || isAwaitingLookup(tokenQuery, tokenIds) || (needsProviders && providerQuery.isPending)
        ? 'resolving'
        : 'ready'
  const authorMaps = useMemo<AuthorMaps>(() => ({ userMap, tokenMap, providers, status }), [userMap, tokenMap, providers, status])

  return { userMap, tokenMap, authorMaps, isLoading: userQuery.isFetching || tokenQuery.isFetching }
}

const AUTHOR_LOOKUP_CHUNK_SIZE = 100

export const useFetchAuthorMaps = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    async (ids: Array<string | null | undefined>): Promise<AuthorMaps> => {
      const authorIds = toAuthorIds(ids)

      if (authorIds.length === 0) {
        return { userMap: {}, tokenMap: {} }
      }

      const tokenIds = toTokenIds(authorIds)

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
