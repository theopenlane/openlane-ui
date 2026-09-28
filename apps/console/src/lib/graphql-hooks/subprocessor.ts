import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_SUBPROCESSOR, UPDATE_SUBPROCESSOR, GET_SUBPROCESSORS, DELETE_BULK_SUBPROCESSORS, GET_SUBPROCESSOR_CATALOG, CREATE_BULK_SUBPROCESSOR } from '@repo/codegen/query/subprocessor'
import {
  type CreateSubprocessorMutation,
  type CreateSubprocessorMutationVariables,
  type UpdateSubprocessorMutation,
  type UpdateSubprocessorMutationVariables,
  type GetSubprocessorsQuery,
  type GetSubprocessorsQueryVariables,
  type DeleteBulkSubprocessorsMutation,
  type DeleteBulkControlMutationVariables,
  type GetSubprocessorCatalogQuery,
  type GetSubprocessorCatalogQueryVariables,
  type CreateBulkSubprocessorMutation,
  type CreateBulkSubprocessorMutationVariables,
  OrderDirection,
  SubprocessorOrderField,
} from '@repo/codegen/src/schema'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { fetchAllConnectionNodes } from './fetch-all-connection-nodes'

import { type TPagination } from '@repo/ui/pagination-types'

type UseGetSubprocessorsArgs = {
  where?: GetSubprocessorsQueryVariables['where']
  pagination?: TPagination | null
  enabled?: boolean
}

export const useGetSubprocessors = ({ where, pagination, enabled = true }: UseGetSubprocessorsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetSubprocessorsQuery>({
    queryKey: ['subprocessors', where, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request<GetSubprocessorsQuery, GetSubprocessorsQueryVariables>(GET_SUBPROCESSORS, {
        where,
        orderBy: [
          {
            direction: OrderDirection.ASC,
            field: SubprocessorOrderField.name,
          },
        ],
        ...pagination?.query,
      }),
    enabled,
  })

  const edges = queryResult.data?.subprocessors?.edges ?? []
  const subprocessors = edges.map((edge) => edge?.node)

  const paginationMeta = {
    totalCount: queryResult.data?.subprocessors?.totalCount ?? 0,
    pageInfo: queryResult.data?.subprocessors?.pageInfo ?? {},
    isLoading: queryResult.isLoading,
  }

  return {
    ...queryResult,
    subprocessors,
    paginationMeta,
  }
}

export type SubprocessorEdge = NonNullable<NonNullable<GetSubprocessorsQuery['subprocessors']>['edges']>[number]

export type SubprocessorNode = NonNullable<SubprocessorEdge>['node']

export const useCreateSubprocessor = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateSubprocessorMutation, unknown, CreateSubprocessorMutationVariables>({
    mutationFn: async (variables) => {
      if (variables.logoFile) {
        return fetchGraphQLWithUpload({
          query: CREATE_SUBPROCESSOR,
          variables,
        })
      }
      return client.request<CreateSubprocessorMutation, CreateSubprocessorMutationVariables>(CREATE_SUBPROCESSOR, variables)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subprocessors'],
      })
    },
  })
}

export const useUpdateSubprocessor = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateSubprocessorMutation, unknown, UpdateSubprocessorMutationVariables>({
    mutationFn: async (variables) => {
      const { updateSubprocessorId, input, logoFile } = variables

      if (logoFile) {
        return fetchGraphQLWithUpload({
          query: UPDATE_SUBPROCESSOR,
          variables: {
            updateSubprocessorId,
            input,
            logoFile,
          },
        })
      }

      return client.request<UpdateSubprocessorMutation, UpdateSubprocessorMutationVariables>(UPDATE_SUBPROCESSOR, variables)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subprocessors'],
      })
    },
  })
}

export const useBulkDeleteSubprocessors = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: async (variables: { ids: string[] }) => client.request<DeleteBulkSubprocessorsMutation, DeleteBulkControlMutationVariables>(DELETE_BULK_SUBPROCESSORS, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subprocessors'] })
    },
  })
}

const CATALOG_PAGE_SIZE = 100

export const useSubprocessorCatalog = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { client } = useGraphQLClient()

  return useQuery({
    queryKey: ['subprocessors', 'catalog'],
    queryFn: () =>
      fetchAllConnectionNodes(async (after) => {
        const data = await client.request<GetSubprocessorCatalogQuery, GetSubprocessorCatalogQueryVariables>(GET_SUBPROCESSOR_CATALOG, { first: CATALOG_PAGE_SIZE, after })
        return data.subprocessors
      }),
    enabled,
  })
}

export const useCreateBulkSubprocessor = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateBulkSubprocessorMutation, unknown, CreateBulkSubprocessorMutationVariables>({
    mutationFn: (variables) => client.request<CreateBulkSubprocessorMutation, CreateBulkSubprocessorMutationVariables>(CREATE_BULK_SUBPROCESSOR, variables),
  })
}
