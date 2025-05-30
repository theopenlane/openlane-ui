import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_CONTROL,
  CREATE_CSV_BULK_CONTROL,
  DELETE_CONTROL,
  GET_ALL_CONTROLS,
  GET_CONTROL_BY_ID,
  GET_CONTROL_COUNTS_BY_STATUS,
  GET_CONTROL_SELECT_OPTIONS,
  UPDATE_CONTROL,
} from '@repo/codegen/query/control'

import {
  Control,
  ControlWhereInput,
  CreateBulkCsvControlMutation,
  CreateBulkCsvControlMutationVariables,
  CreateControlMutation,
  CreateControlMutationVariables,
  DeleteControlMutation,
  DeleteControlMutationVariables,
  GetAllControlsQuery,
  GetAllControlsQueryVariables,
  GetControlByIdQuery,
  GetControlCountsByStatusQuery,
  GetControlSelectOptionsQuery,
  GetControlSelectOptionsQueryVariables,
  UpdateControlMutation,
  UpdateControlMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'

type UseGetAllControlsArgs = {
  where?: GetAllControlsQueryVariables['where']
  pagination?: TPagination | null
  orderBy?: GetAllControlsQueryVariables['orderBy']
  enabled?: boolean
}

export const useGetAllControls = ({ where, pagination, orderBy, enabled = true }: UseGetAllControlsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllControlsQuery>({
    queryKey: ['controls', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_ALL_CONTROLS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
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

export const useGetControlCountsByStatus = (programId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlCountsByStatusQuery, unknown>({
    queryKey: ['controls', 'counts', programId],
    queryFn: async () => client.request(GET_CONTROL_COUNTS_BY_STATUS, { programId }),
    enabled: !!programId,
  })
}

export const useCreateBulkCSVControl = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvControlMutation, unknown, CreateBulkCsvControlMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_CONTROL, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export const useDeleteControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteControlMutation, unknown, DeleteControlMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export const useCreateControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateControlMutation, unknown, CreateControlMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export const useControlSelect = ({ where }: { where?: ControlWhereInput }) => {
  const { client } = useGraphQLClient()

  const { data, isLoading, error } = useQuery<GetControlSelectOptionsQuery>({
    queryKey: ['controls', where, 'select'],
    queryFn: async () => {
      return client.request<GetControlSelectOptionsQuery, GetControlSelectOptionsQueryVariables>(GET_CONTROL_SELECT_OPTIONS, { where })
    },
  })

  const controlOptions = data?.controls?.edges?.flatMap((edge) => (edge?.node?.id && edge.node.refCode ? [{ label: edge.node.refCode, value: edge.node.id }] : [])) ?? []

  return {
    controlOptions,
    isLoading,
    error,
  }
}
