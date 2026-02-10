import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_TRUST_CENTER_NDA,
  DELETE_BULK_TRUST_CENTER_NDA_REQUEST,
  GET_NDA_REQUESTS_COUNT,
  GET_TRUST_CENTER_NDA_FILES,
  GET_TRUST_CENTER_NDA_REQUESTS,
  UPDATE_TRUST_CENTER_NDA,
  UPDATE_TRUST_CENTER_NDA_REQUEST,
} from '@repo/codegen/query/trust-center-NDA'
import {
  CreateTrustCenterNdaMutation,
  CreateTrustCenterNdaMutationVariables,
  GetNdaRequestCountQuery,
  GetNdaRequestCountQueryVariables,
  GetTrustCenterNdaFilesQuery,
  GetTrustCenterNdaRequestsQuery,
  GetTrustCenterNdaRequestsQueryVariables,
  OrderDirection,
  TrustCenterNdaRequest,
  TrustCenterNdaRequestOrder,
  TrustCenterNdaRequestOrderField,
  TrustCenterNdaRequestWhereInput,
  TrustCenterNdaRequestTrustCenterNdaRequestStatus,
  UpdateTrustCenterNdaMutation,
  UpdateTrustCenterNdaMutationVariables,
  UpdateTrustCenterNdaRequestMutation,
  UpdateTrustCenterNdaRequestMutationVariables,
  DeleteBulkTrustCenterNdaRequestMutation,
  DeleteBulkTrustCenterNdaRequestMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'

export const useGetTrustCenterNDAFiles = (enabled = true) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterNdaFilesQuery>({
    queryKey: ['trustCenterNdaFiles'],
    queryFn: () =>
      client.request<GetTrustCenterNdaFilesQuery>(GET_TRUST_CENTER_NDA_FILES, {
        where: {},
      }),
    enabled,
  })

  const templateEdges = queryResult.data?.templates?.edges ?? []
  const latestTemplate = templateEdges[0]?.node
  const files = latestTemplate?.files?.edges?.map((e) => e?.node) ?? []
  const latestFile = files.at(-1)

  return {
    ...queryResult,
    latestFile,
    latestTemplate,
  }
}

export const useCreateTrustCenterNDA = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateTrustCenterNdaMutation, unknown, CreateTrustCenterNdaMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: CREATE_TRUST_CENTER_NDA,
        variables,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterNdaFiles'] })
    },
  })
}

export const useUpdateTrustCenterNDA = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterNdaMutation, unknown, UpdateTrustCenterNdaMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: UPDATE_TRUST_CENTER_NDA,
        variables,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterNdaFiles'] })
    },
  })
}

export const useUpdateTrustCenterNdaRequest = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterNdaRequestMutation, unknown, UpdateTrustCenterNdaRequestMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: UPDATE_TRUST_CENTER_NDA_REQUEST,
        variables,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'ndaRequests'] })
    },
  })
}

export const useGetNDAStats = ({ ndaApprovalRequired, enabled = true }: { ndaApprovalRequired: boolean; enabled: boolean }) => {
  const { client } = useGraphQLClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const variables: GetNdaRequestCountQueryVariables = {
    where: ndaApprovalRequired ? { status: TrustCenterNdaRequestTrustCenterNdaRequestStatus.NEEDS_APPROVAL } : { createdAtGTE: thirtyDaysAgo.toISOString() },
  }

  const queryResult = useQuery<GetNdaRequestCountQuery>({
    queryKey: ['ndaRequestsCount', ndaApprovalRequired],
    queryFn: () => client.request<GetNdaRequestCountQuery>(GET_NDA_REQUESTS_COUNT, variables),
    enabled,
  })

  return {
    ...queryResult,
    count: queryResult.data?.trustCenterNdaRequests?.totalCount ?? 0,
  }
}

type UseGetTrustCenterNdaRequestsArgs = {
  where?: TrustCenterNdaRequestWhereInput
  pagination?: TPagination | null
  orderBy?: TrustCenterNdaRequestOrder[]
  enabled?: boolean
}

export const useGetTrustCenterNdaRequests = ({ where, pagination, orderBy, enabled = true }: UseGetTrustCenterNdaRequestsArgs) => {
  const { client } = useGraphQLClient()
  const paginationQuery = pagination?.query
  const variables: GetTrustCenterNdaRequestsQueryVariables = {
    where,
    orderBy,
    ...(paginationQuery
      ? {
          ...paginationQuery,
          after: paginationQuery.after ?? undefined,
          before: paginationQuery.before ?? undefined,
        }
      : {}),
  }

  const queryResult = useQuery<GetTrustCenterNdaRequestsQuery>({
    queryKey: ['trustCenter', 'ndaRequests', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () => client.request<GetTrustCenterNdaRequestsQuery, GetTrustCenterNdaRequestsQueryVariables>(GET_TRUST_CENTER_NDA_REQUESTS, variables),
    enabled,
  })

  const edges = queryResult.data?.trustCenterNdaRequests?.edges ?? []
  const requests = edges.map((edge) => edge?.node).filter(Boolean) as TrustCenterNdaRequest[]
  const paginationMeta = {
    totalCount: queryResult.data?.trustCenterNdaRequests?.totalCount ?? 0,
    pageInfo: queryResult.data?.trustCenterNdaRequests?.pageInfo ?? {},
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    requests,
    paginationMeta,
  }
}

export const useBulkDeleteTrustCenterNdaRequest = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkTrustCenterNdaRequestMutation, unknown, DeleteBulkTrustCenterNdaRequestMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_BULK_TRUST_CENTER_NDA_REQUEST, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'ndaRequests'] })
    },
  })
}

export const DEFAULT_NDA_REQUESTS_ORDER: TrustCenterNdaRequestOrder[] = [
  {
    field: TrustCenterNdaRequestOrderField.created_at,
    direction: OrderDirection.DESC,
  },
]
