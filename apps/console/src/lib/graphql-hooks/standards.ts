import { InfiniteData, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  CREATE_CONTROLS_BY_CLONE,
  CREATE_STANDARD,
  DELETE_STANDARD,
  GET_ALL_STANDARDS,
  GET_ALL_STANDARDS_SELECT,
  GET_STANDARD_DETAILS,
  GET_STANDARDS_PAGINATED,
  UPDATE_STANDARD,
} from '@repo/codegen/query/standards'

import {
  CloneControlInput,
  CreateControlsByCloneMutation,
  GetAllStandardsQuery,
  GetAllStandardsQueryVariables,
  GetStandardDetailsQuery,
  Standard,
  CreateStandardMutation,
  CreateStandardMutationVariables,
  UpdateStandardMutation,
  UpdateStandardMutationVariables,
  DeleteStandardMutation,
  DeleteStandardMutationVariables,
  GetStandardsPaginatedQuery,
  GetStandardsPaginatedQueryVariables,
  StandardWhereInput,
} from '@repo/codegen/src/schema'
import { useMemo } from 'react'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export const useGetStandards = ({ where, enabled = true }: { where?: GetAllStandardsQueryVariables['where']; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', where],
    queryFn: () => client.request(GET_ALL_STANDARDS, { where }),
    enabled,
  })
}

export const useGetStandardDetails = (standardId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetStandardDetailsQuery>({
    queryKey: ['standards', standardId],
    queryFn: () => client.request(GET_STANDARD_DETAILS, { standardId }),
    enabled: !!standardId,
  })
}

export const useCloneControls = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateControlsByCloneMutation, Error, { input: CloneControlInput }>({
    mutationFn: ({ input }) => client.request(CREATE_CONTROLS_BY_CLONE, { input }),
  })
}

export const useStandardsSelect = ({ where, enabled = true }: { where?: GetAllStandardsQueryVariables['where']; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const res = useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', where, 'select'],
    queryFn: () => client.request(GET_ALL_STANDARDS_SELECT, { where }),
    enabled,
  })

  const standardOptions = useMemo(() => {
    const frameworks = res.data?.standards?.edges?.map((edge) => edge?.node as Standard).filter(Boolean) ?? []

    const sorted = frameworks.sort((a, b) => (a.shortName || '').localeCompare(b.shortName || ''))

    return sorted.map((framework) => ({
      label: framework.shortName || '',
      value: framework.id || '',
    }))
  }, [res.data])

  return {
    standardOptions,
    ...res,
  }
}

export const useCreateStandard = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateStandardMutation, unknown, CreateStandardMutationVariables>({
    mutationFn: async (variables) => {
      const { input, logoFile } = variables
      if (logoFile) {
        return fetchGraphQLWithUpload({
          query: CREATE_STANDARD,
          variables: {
            input,
            logoFile,
          },
        })
      }

      return client.request<CreateStandardMutation, CreateStandardMutationVariables>(CREATE_STANDARD, variables)
    },

    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['standards'] })
    },
  })
}

export const useUpdateStandard = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateStandardMutation, unknown, UpdateStandardMutationVariables>({
    mutationFn: async (variables) => {
      const { input, updateStandardId, logoFile } = variables

      if (logoFile) {
        return fetchGraphQLWithUpload({
          query: UPDATE_STANDARD,
          variables: {
            updateStandardId,
            input,
            logoFile,
          },
        })
      }

      return client.request<UpdateStandardMutation, UpdateStandardMutationVariables>(UPDATE_STANDARD, variables)
    },

    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['standards'] })
    },
  })
}

export const useDeleteStandard = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteStandardMutation, Error, DeleteStandardMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteStandardMutation, DeleteStandardMutationVariables>(DELETE_STANDARD, variables),

    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['standards'] })
    },
  })
}

type StandardEdge = NonNullable<NonNullable<GetStandardsPaginatedQuery['standards']>['edges']>[number]

export type StandardNode = NonNullable<NonNullable<StandardEdge>['node']>

export const useGetAllStandardsInfinite = ({ where = {}, pagination, enabled = true }: { where?: StandardWhereInput; pagination: TPagination; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const queryKey = useMemo(() => ['standards', 'infinite', where, pagination.query] as const, [pagination.query, where])

  const queryResult = useInfiniteQuery<GetStandardsPaginatedQuery, Error, InfiniteData<GetStandardsPaginatedQuery>, typeof queryKey, string | null>({
    queryKey,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      client.request<GetStandardsPaginatedQuery, GetStandardsPaginatedQueryVariables>(GET_STANDARDS_PAGINATED, {
        ...pagination.query,
        first: pagination.query.first,
        after: pageParam ?? undefined,
        where,
      }),

    getNextPageParam: (lastPage) => {
      const pageInfo = lastPage.standards?.pageInfo
      if (!pageInfo?.hasNextPage) return undefined
      return pageInfo.endCursor ?? undefined
    },

    staleTime: Infinity,
    enabled,
  })

  const standards: StandardNode[] = queryResult.data?.pages.flatMap((page) => page.standards?.edges?.map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => !!node) ?? []) ?? []

  const lastPage = queryResult.data?.pages.at(-1)

  const paginationMeta = {
    totalCount: lastPage?.standards?.totalCount ?? 0,
    pageInfo: lastPage?.standards?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    standards,
    paginationMeta,
  }
}
