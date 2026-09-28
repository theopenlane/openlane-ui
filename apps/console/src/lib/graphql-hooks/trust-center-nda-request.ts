import { useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_CSV_BULK_TRUST_CENTER_NDA_REQUEST,
  CREATE_TRUST_CENTER_NDA,
  DELETE_BULK_TRUST_CENTER_NDA_REQUEST,
  GET_NDA_REQUESTS_COUNT,
  GET_ALL_TRUST_CENTER_NDA_FILES,
  GET_ALL_TRUST_CENTER_NDA_REQUESTS,
  GET_TRUST_CENTER_NDA_REQUEST_EMAILS,
  UPDATE_TRUST_CENTER_NDA,
  UPDATE_TRUST_CENTER_NDA_REQUEST,
} from '@repo/codegen/query/trust-center-nda-request'
import {
  type CreateBulkCsvTrustCenterNdaRequestMutation,
  type CreateBulkCsvTrustCenterNdaRequestMutationVariables,
  type CreateTrustCenterNdaMutation,
  type CreateTrustCenterNdaMutationVariables,
  type GetNdaRequestCountQuery,
  type GetNdaRequestCountQueryVariables,
  type GetTrustCenterNdaFilesQuery,
  type GetTrustCenterNdaRequestEmailsQuery,
  type GetTrustCenterNdaRequestEmailsQueryVariables,
  type GetTrustCenterNdaRequestsQuery,
  type GetTrustCenterNdaRequestsQueryVariables,
  OrderDirection,
  type TrustCenterNdaRequest,
  type TrustCenterNdaRequestOrder,
  TrustCenterNdaRequestOrderField,
  type TrustCenterNdaRequestWhereInput,
  TrustCenterNdaRequestTrustCenterNdaRequestStatus,
  type UpdateTrustCenterNdaMutation,
  type UpdateTrustCenterNdaMutationVariables,
  type UpdateTrustCenterNdaRequestMutation,
  type UpdateTrustCenterNdaRequestMutationVariables,
  type DeleteBulkTrustCenterNdaRequestMutation,
  type DeleteBulkTrustCenterNdaRequestMutationVariables,
  TemplateTemplateKind,
} from '@repo/codegen/src/schema'
import { startOfDay, subDays } from 'date-fns'
import { STATS_WINDOW_DAYS } from '@/constants/stats'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import { chunk, mapWithConcurrency } from '@/utils/async'

const NDA_REQUEST_EMAIL_LOOKUP_CHUNK_SIZE = 50
const MAX_CONNECTION_RESULTS = 100
const NDA_REQUEST_EMAIL_LOOKUP_CONCURRENCY = 4

export const useGetTrustCenterNDAFiles = (enabled = true) => {
  const { client } = useGraphQLClient()

  const templateWhere = {
    kind: TemplateTemplateKind.TRUSTCENTER_NDA,
  }

  const queryResult = useQuery<GetTrustCenterNdaFilesQuery>({
    queryKey: ['trustCenterNdaFiles'],
    queryFn: () =>
      client.request<GetTrustCenterNdaFilesQuery>(GET_ALL_TRUST_CENTER_NDA_FILES, {
        where: templateWhere,
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

const statsWindowStart = () => startOfDay(subDays(new Date(), STATS_WINDOW_DAYS)).toISOString()

export const ndaRequestsWhere = {
  needingApproval: (): TrustCenterNdaRequestWhereInput => ({ status: TrustCenterNdaRequestTrustCenterNdaRequestStatus.NEEDS_APPROVAL }),
  signedWithinWindow: (): TrustCenterNdaRequestWhereInput => ({ signedAtGTE: statsWindowStart() }),
  createdWithinWindow: (): TrustCenterNdaRequestWhereInput => ({ createdAtGTE: statsWindowStart() }),
}

export const useGetNdaRequestCount = ({ where, enabled = true }: { where: TrustCenterNdaRequestWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetNdaRequestCountQuery>({
    queryKey: ['trustCenter', 'ndaRequests', 'count', where],
    queryFn: () => client.request<GetNdaRequestCountQuery, GetNdaRequestCountQueryVariables>(GET_NDA_REQUESTS_COUNT, { where }),
    enabled,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.trustCenterNdaRequests?.totalCount ?? 0,
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
    queryFn: () => client.request<GetTrustCenterNdaRequestsQuery, GetTrustCenterNdaRequestsQueryVariables>(GET_ALL_TRUST_CENTER_NDA_REQUESTS, variables),
    enabled,
  })

  const edges = queryResult.data?.trustCenterNdaRequests?.edges ?? []
  const requests = edges.map((edge) => edge?.node).filter(Boolean) as TrustCenterNdaRequest[]
  const paginationMeta = {
    totalCount: queryResult.data?.trustCenterNdaRequests?.totalCount ?? 0,
    pageInfo: queryResult.data?.trustCenterNdaRequests?.pageInfo ?? {},
    isLoading: queryResult.isLoading,
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

export const useCreateBulkCSVTrustCenterNdaRequest = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvTrustCenterNdaRequestMutation, unknown, CreateBulkCsvTrustCenterNdaRequestMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_TRUST_CENTER_NDA_REQUEST, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'ndaRequests'] })
    },
  })
}

export const useFindExistingNdaRequestEmails = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    async (trustCenterID: string, emails: string[]): Promise<string[]> => {
      const pages = await mapWithConcurrency(chunk(emails, NDA_REQUEST_EMAIL_LOOKUP_CHUNK_SIZE), NDA_REQUEST_EMAIL_LOOKUP_CONCURRENCY, (emails) =>
        client.request<GetTrustCenterNdaRequestEmailsQuery, GetTrustCenterNdaRequestEmailsQueryVariables>(GET_TRUST_CENTER_NDA_REQUEST_EMAILS, {
          where: { trustCenterID, or: emails.map((email) => ({ emailEqualFold: email })) },
          first: MAX_CONNECTION_RESULTS,
        }),
      )

      return [...new Set(pages.flatMap((page) => page.trustCenterNdaRequests.edges?.flatMap((edge) => (edge?.node ? [edge.node.email] : [])) ?? []))]
    },
    [client],
  )
}
