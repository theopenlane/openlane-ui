import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { Option } from '@repo/ui/multiple-selector'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TPagination } from '@repo/ui/pagination-types'

import {
  GetTagsQuery,
  GetAllTagDefinitionsPaginatedQuery,
  GetAllTagDefinitionsPaginatedQueryVariables,
  CreateTagDefinitionMutation,
  CreateTagDefinitionMutationVariables,
  UpdateTagDefinitionMutation,
  UpdateTagDefinitionMutationVariables,
  DeleteTagDefinitionMutation,
  DeleteTagDefinitionMutationVariables,
  GetTagDefinitionDetailsQuery,
  GetTagDefinitionDetailsQueryVariables,
} from '@repo/codegen/src/schema'

import { GET_TAGS, GET_ALL_TAG_DEFINITIONS_PAGINATED, CREATE_TAG_DEFINITION, UPDATE_TAG_DEFINITION, DELETE_TAG_DEFINITION, GET_TAG_DEFINITION_DETAILS } from '@repo/codegen/query/tag-definition'

export const useGetTags = () => {
  const { client } = useGraphQLClient()

  const query = useQuery<GetTagsQuery>({
    queryKey: ['tags', 'options'],
    queryFn: () => client.request<GetTagsQuery>(GET_TAGS),
  })

  const tagOptions: Option[] =
    query.data?.tagDefinitions?.edges?.map((edge) => ({
      value: edge?.node?.name || '',
      label: edge?.node?.name || '',
    })) ?? []

  return {
    ...query,
    tagOptions,
  }
}

type TagDefinitionEdge = NonNullable<NonNullable<GetAllTagDefinitionsPaginatedQuery['tagDefinitions']>['edges']>[number]
export type TagDefinitionNode = NonNullable<TagDefinitionEdge>['node']
export type TagDefinitionNodeNonNull = NonNullable<TagDefinitionNode>

type UseTagsPaginatedArgs = {
  where?: GetAllTagDefinitionsPaginatedQueryVariables['where']
  pagination?: TPagination
  enabled?: boolean
}

export const useTagsPaginated = ({ where, pagination, enabled = true }: UseTagsPaginatedArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllTagDefinitionsPaginatedQuery>({
    queryKey: ['tags', 'list', where, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request<GetAllTagDefinitionsPaginatedQuery, GetAllTagDefinitionsPaginatedQueryVariables>(GET_ALL_TAG_DEFINITIONS_PAGINATED, {
        where,
        ...(pagination?.query ?? {}),
      }),
    enabled,
  })

  const edges = queryResult.data?.tagDefinitions?.edges ?? []

  const tags: TagDefinitionNodeNonNull[] = edges
    .filter((edge): edge is NonNullable<(typeof edges)[number]> => edge != null)
    .map((edge) => edge.node)
    .filter((node): node is TagDefinitionNodeNonNull => node != null)

  const paginationMeta = {
    totalCount: queryResult.data?.tagDefinitions?.totalCount ?? 0,
    pageInfo: queryResult.data?.tagDefinitions?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    tags,
    paginationMeta,
    isLoading: queryResult.isFetching,
  }
}

export const useCreateTag = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateTagDefinitionMutation, unknown, CreateTagDefinitionMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_TAG_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export const useUpdateTag = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateTagDefinitionMutation, unknown, UpdateTagDefinitionMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_TAG_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export const useDeleteTag = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteTagDefinitionMutation, unknown, DeleteTagDefinitionMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_TAG_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export const useGetTagDetails = (tagDefinitionId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTagDefinitionDetailsQuery>({
    queryKey: ['tags', 'details', tagDefinitionId],
    queryFn: () => client.request<GetTagDefinitionDetailsQuery, GetTagDefinitionDetailsQueryVariables>(GET_TAG_DEFINITION_DETAILS, { tagDefinitionId: tagDefinitionId! }),
    enabled: !!tagDefinitionId,
  })
}
