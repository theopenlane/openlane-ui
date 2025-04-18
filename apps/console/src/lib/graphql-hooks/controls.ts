import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_CONTROLS, GET_CONTROL_BY_ID, UPDATE_CONTROL } from '@repo/codegen/query/control'

import { Control, GetAllControlsQuery, GetAllControlsQueryVariables, GetControlByIdQuery, UpdateControlMutation, UpdateControlMutationVariables } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

type UseGetAllControlsArgs = {
  where?: GetAllControlsQueryVariables['where']
  pagination?: TPagination | null
  orderBy?: GetAllControlsQueryVariables['orderBy']
}

export const useGetAllControls = ({ where, pagination, orderBy }: UseGetAllControlsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllControlsQuery>({
    queryKey: ['controls', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_ALL_CONTROLS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled: where !== undefined,
  })

  const edges = queryResult.data?.controls?.edges ?? []
  const controls = edges.map((edge) => edge?.node) as Control[]

  const paginationMeta = {
    totalCount: queryResult.data?.controls?.totalCount ?? 0,
    pageInfo: queryResult.data?.controls?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    controls,
    paginationMeta,
  }
}

export const useGetControlById = (controlId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlByIdQuery, unknown>({
    queryKey: ['controls', controlId],
    queryFn: async () => client.request(GET_CONTROL_BY_ID, { controlId }),
    enabled: !!controlId,
  })
}

export const useUpdateControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlMutation, unknown, UpdateControlMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['controls'] }),
  })
}
