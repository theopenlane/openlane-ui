import { useMemo } from 'react'
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type GetVendorDirectoryQuery, type GetVendorDirectoryQueryVariables } from '@repo/codegen/src/schema'
import { GET_VENDOR_DIRECTORY } from '@repo/codegen/query/vendor-directory'
import { type TPagination } from '@repo/ui/pagination-types'

export type VendorDirectoryGroupNode = NonNullable<NonNullable<GetVendorDirectoryQuery['directoryGroups']['edges']>[number]>['node']
export type VendorDirectoryGroup = NonNullable<VendorDirectoryGroupNode>
export type VendorDirectoryMember = NonNullable<NonNullable<NonNullable<VendorDirectoryGroup['members']['edges']>[number]>['node']>

type UseVendorDirectoryArgs = {
  integrationIDs: string[]
  pagination?: TPagination
  enabled?: boolean
}

export const useVendorDirectory = ({ integrationIDs, pagination, enabled = true }: UseVendorDirectoryArgs) => {
  const { client } = useGraphQLClient()

  const queryKey = ['vendorDirectory', integrationIDs]

  const queryResult = useInfiniteQuery<GetVendorDirectoryQuery, Error, InfiniteData<GetVendorDirectoryQuery>, typeof queryKey, number>({
    queryKey,
    initialPageParam: 1,
    queryFn: () =>
      client.request<GetVendorDirectoryQuery, GetVendorDirectoryQueryVariables>(GET_VENDOR_DIRECTORY, {
        integrationIDs,
        ...pagination?.query,
      }),
    getNextPageParam: (lastPage, allPages) => (lastPage.directoryGroups?.pageInfo?.hasNextPage ? allPages.length + 1 : undefined),
    staleTime: Infinity,
    enabled: enabled && integrationIDs.length > 0,
  })

  const pages = queryResult.data?.pages
  const groups = useMemo<VendorDirectoryGroup[]>(() => pages?.flatMap((page) => (page.directoryGroups?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))) ?? [], [pages])

  const memberAggregates = useMemo(() => {
    let totalMembers = 0
    let loadedMembers = 0
    let matchedMembers = 0
    for (const group of groups) {
      totalMembers += group.members.totalCount
      for (const edge of group.members.edges ?? []) {
        const node = edge?.node
        if (!node) continue
        loadedMembers++
        if (node.directoryAccount.identityHolderID) matchedMembers++
      }
    }
    return { totalMembers, loadedMembers, matchedMembers }
  }, [groups])

  const lastPage = pages?.at(-1)
  const totalGroups = lastPage?.directoryGroups?.totalCount ?? 0

  const paginationMeta = {
    totalCount: totalGroups,
    pageInfo: lastPage?.directoryGroups?.pageInfo,
    isLoading: queryResult.isLoading || queryResult.isFetchingNextPage,
  }

  return {
    ...queryResult,
    groups,
    totalGroups,
    paginationMeta,
    ...memberAggregates,
  }
}
