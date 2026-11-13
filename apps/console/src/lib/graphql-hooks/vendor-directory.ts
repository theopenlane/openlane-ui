import { useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import {
  type DirectoryGroupWhereInput,
  type GetDirectoryGroupMembersQuery,
  type GetDirectoryGroupMembersQueryVariables,
  type GetVendorDirectoryCoverageQuery,
  type GetVendorDirectoryCoverageQueryVariables,
  type GetVendorDirectoryQuery,
  type GetVendorDirectoryQueryVariables,
  type PageInfo,
} from '@repo/codegen/src/schema'
import { GET_DIRECTORY_GROUP_MEMBERS, GET_VENDOR_DIRECTORY, GET_VENDOR_DIRECTORY_COVERAGE } from '@repo/codegen/query/vendor-directory'

export type VendorDirectoryGroup = NonNullable<NonNullable<NonNullable<GetVendorDirectoryQuery['directoryGroups']['edges']>[number]>['node']>
export type VendorDirectoryMember = NonNullable<NonNullable<NonNullable<GetDirectoryGroupMembersQuery['directoryGroup']['members']['edges']>[number]>['node']>

const VENDOR_DIRECTORY_GROUPS_PAGE_SIZE = 30
const VENDOR_DIRECTORY_STALE_TIME_MS = 5 * 60 * 1000 // 5min

const nextCursor = (pageInfo: Pick<PageInfo, 'hasNextPage' | 'endCursor'>): string | undefined => (pageInfo.hasNextPage ? (pageInfo.endCursor ?? undefined) : undefined)

export const useVendorDirectoryGroups = ({ integrationIDs, includeEmptyGroups }: { integrationIDs: string[]; includeEmptyGroups: boolean }) => {
  const { client } = useGraphQLClient()

  const where: DirectoryGroupWhereInput = includeEmptyGroups ? { integrationIDIn: integrationIDs } : { integrationIDIn: integrationIDs, hasMembers: true }

  const queryResult = useInfiniteQuery({
    queryKey: ['vendorDirectory', 'groups', where],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      client.request<GetVendorDirectoryQuery, GetVendorDirectoryQueryVariables>(GET_VENDOR_DIRECTORY, {
        where,
        first: VENDOR_DIRECTORY_GROUPS_PAGE_SIZE,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) => nextCursor(lastPage.directoryGroups.pageInfo),
    enabled: integrationIDs.length > 0,
    staleTime: VENDOR_DIRECTORY_STALE_TIME_MS,
  })

  const pages = queryResult.data?.pages
  const groups = useMemo(() => pages?.flatMap((page) => getNodes(page.directoryGroups)) ?? [], [pages])

  return { ...queryResult, groups }
}

export const useVendorDirectoryGroup = ({ integrationIDs, groupID }: { integrationIDs: string[]; groupID: string | null }) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({
    queryKey: ['vendorDirectory', 'group', integrationIDs, groupID],
    queryFn: () =>
      client.request<GetVendorDirectoryQuery, GetVendorDirectoryQueryVariables>(GET_VENDOR_DIRECTORY, {
        where: { integrationIDIn: integrationIDs, id: groupID },
        first: 1,
      }),
    enabled: !!groupID && integrationIDs.length > 0,
    staleTime: VENDOR_DIRECTORY_STALE_TIME_MS,
    placeholderData: undefined,
  })

  return {
    ...queryResult,
    group: getNodes(queryResult.data?.directoryGroups)[0] ?? null,
  }
}

export const useVendorDirectoryCoverage = ({ integrationIDs }: { integrationIDs: string[] }) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({
    queryKey: ['vendorDirectory', 'coverage', integrationIDs],
    queryFn: () => client.request<GetVendorDirectoryCoverageQuery, GetVendorDirectoryCoverageQueryVariables>(GET_VENDOR_DIRECTORY_COVERAGE, { integrationIDs }),
    enabled: integrationIDs.length > 0,
    staleTime: VENDOR_DIRECTORY_STALE_TIME_MS,
  })

  return {
    ...queryResult,
    totalGroups: queryResult.data?.allGroups.totalCount,
    emptyGroups: queryResult.data?.emptyGroups.totalCount,
    totalAccounts: queryResult.data?.groupedAccounts.totalCount,
    matchedAccounts: queryResult.data?.matchedAccounts.totalCount,
  }
}

export const useDirectoryGroupMembers = ({ groupID }: { groupID: string }) => {
  const { client } = useGraphQLClient()

  const queryResult = useInfiniteQuery({
    queryKey: ['vendorDirectory', 'members', groupID],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      client.request<GetDirectoryGroupMembersQuery, GetDirectoryGroupMembersQueryVariables>(GET_DIRECTORY_GROUP_MEMBERS, {
        groupID,
        first: MAX_CONNECTION_RESULTS,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) => nextCursor(lastPage.directoryGroup.members.pageInfo),
    staleTime: VENDOR_DIRECTORY_STALE_TIME_MS,
  })

  const pages = queryResult.data?.pages
  const members = useMemo(() => pages?.flatMap((page) => getNodes(page.directoryGroup.members)) ?? [], [pages])

  return {
    ...queryResult,
    members,
    totalMembers: pages?.[0]?.directoryGroup.members.totalCount ?? 0,
  }
}
