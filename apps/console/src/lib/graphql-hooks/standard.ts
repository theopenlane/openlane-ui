import { type InfiniteData, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
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
} from '@repo/codegen/query/standard'

import {
  type CloneControlInput,
  type CreateControlsByCloneMutation,
  type GetAllStandardsQuery,
  type GetStandardDetailsQuery,
  type Standard,
  type CreateStandardMutation,
  type CreateStandardMutationVariables,
  type UpdateStandardMutation,
  type UpdateStandardMutationVariables,
  type DeleteStandardMutation,
  type DeleteStandardMutationVariables,
  type GetStandardsPaginatedQuery,
  type GetStandardsPaginatedQueryVariables,
  type StandardWhereInput,
  OrderDirection,
  StandardOrderField,
} from '@repo/codegen/src/schema'
import { useMemo } from 'react'
import { type TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { EXCLUDE_SYSTEM_STANDARDS_WHERE, type TSystemStandard } from '@/constants/standards'
import { mergeWhere } from '@/lib/merge-where'

type TStandardsQueryArgs = {
  where?: StandardWhereInput | null
  enabled?: boolean
  includeSystemStandards?: boolean
}

const resolveStandardsWhere = (where: TStandardsQueryArgs['where'], includeSystemStandards?: boolean): StandardWhereInput =>
  mergeWhere<StandardWhereInput>([where, includeSystemStandards ? undefined : EXCLUDE_SYSTEM_STANDARDS_WHERE])

export const useGetStandards = ({ where, enabled = true, includeSystemStandards }: TStandardsQueryArgs) => {
  const { client } = useGraphQLClient()
  const effectiveWhere = resolveStandardsWhere(where, includeSystemStandards)

  const queryResult = useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', effectiveWhere],
    queryFn: () => client.request(GET_ALL_STANDARDS, { where: effectiveWhere }),
    enabled,
  })

  return {
    ...queryResult,
    isLoading: queryResult.isPending,
  }
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

export const useStandardsSelect = ({ where, enabled = true, includeSystemStandards }: TStandardsQueryArgs) => {
  const { client } = useGraphQLClient()
  const effectiveWhere = resolveStandardsWhere(where, includeSystemStandards)

  const res = useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', effectiveWhere, 'select'],
    queryFn: () => client.request(GET_ALL_STANDARDS_SELECT, { where: effectiveWhere }),
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

export const useSystemStandard = (systemStandard: TSystemStandard) => {
  const res = useStandardsSelect({
    where: { framework: systemStandard.framework, systemOwned: true, isPublic: true },
    includeSystemStandards: true,
  })

  return {
    ...res,
    standardId: res.data?.standards?.edges?.[0]?.node?.id,
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

export const useGetAllStandardsInfinite = ({ where, pagination, enabled = true, includeSystemStandards }: TStandardsQueryArgs & { pagination: TPagination }) => {
  const { client } = useGraphQLClient()
  const effectiveWhere = resolveStandardsWhere(where, includeSystemStandards)

  const queryKey = ['standards', 'infinite', effectiveWhere, pagination.query] as const

  const queryResult = useInfiniteQuery<GetStandardsPaginatedQuery, Error, InfiniteData<GetStandardsPaginatedQuery>, typeof queryKey, string | null>({
    queryKey,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      client.request<GetStandardsPaginatedQuery, GetStandardsPaginatedQueryVariables>(GET_STANDARDS_PAGINATED, {
        ...pagination.query,
        first: pagination.query.first,
        after: pageParam ?? undefined,
        where: effectiveWhere,
        orderBy: [{ field: StandardOrderField.short_name, direction: OrderDirection.ASC }],
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
    isLoading: queryResult.isPending,
  }

  return {
    ...queryResult,
    standards,
    paginationMeta,
    isLoading: queryResult.isPending,
  }
}

export const useGetRecommendedStandards = ({ where, enabled = true, includeSystemStandards }: TStandardsQueryArgs) => {
  const { client } = useGraphQLClient()
  const effectiveWhere = resolveStandardsWhere(where, includeSystemStandards)

  const queryResult = useQuery<StandardNode[]>({
    queryKey: ['standards', 'recommended', effectiveWhere],
    queryFn: async () => {
      const nodes: StandardNode[] = []
      let after: string | undefined = undefined

      do {
        const page: GetStandardsPaginatedQuery = await client.request<GetStandardsPaginatedQuery, GetStandardsPaginatedQueryVariables>(GET_STANDARDS_PAGINATED, {
          where: effectiveWhere,
          first: 100,
          after,
          orderBy: [{ field: StandardOrderField.short_name, direction: OrderDirection.ASC }],
        })

        nodes.push(...(page.standards?.edges?.map((edge) => edge?.node).filter((node): node is StandardNode => !!node) ?? []))

        const pageInfo = page.standards?.pageInfo
        after = pageInfo?.hasNextPage ? (pageInfo.endCursor ?? undefined) : undefined
      } while (after)

      return nodes
    },
    enabled,
    staleTime: Infinity,
  })

  const standards: StandardNode[] = queryResult.data ?? []

  return {
    ...queryResult,
    standards,
    isLoading: queryResult.isPending,
  }
}
