import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_EVIDENCE,
  DELETE_EVIDENCE,
  GET_ALL_EVIDENCES,
  GET_EVIDENCE,
  GET_EVIDENCE_FILES,
  GET_EVIDENCE_FILES_BY_ID,
  GET_EVIDENCE_FILES_PAGINATED,
  GET_EVIDENCE_LIST,
  GET_FIRST_FIVE_EVIDENCES_BY_STATUS,
  GET_RENEW_EVIDENCE,
  UPDATE_EVIDENCE,
  GET_EVIDENCE_TREND_DATA,
  GET_PROGRAM_EVIDENCE_TREND_DATA,
  GET_EVIDENCE_COUNTS_BY_STATUS_BY_PROGRAM_ID,
  GET_EVIDENCE_COUNTS_BY_STATUS_ALL_PROGRAMS,
  GET_EVIDENCE_SUGGESTED_ACTIONS,
  GET_EVIDENCE_ITEMS_MISSING_ARTIFACT_COUNT,
  GET_EVIDENCE_COMMENTS,
  UPDATE_EVIDENCE_COMMENT,
  CREATE_CSV_BULK_EVIDENCE,
  BULK_DELETE_EVIDENCE,
  BULK_EDIT_EVIDENCE,
} from '@repo/codegen/query/evidence'
import {
  CreateEvidenceMutation,
  CreateEvidenceMutationVariables,
  EvidenceWhereInput,
  FileOrder,
  GetAllEvidencesQuery,
  GetEvidenceFilesPaginatedQuery,
  GetEvidenceFilesQuery,
  GetEvidenceQuery,
  InputMaybe,
  UpdateEvidenceMutation,
  UpdateEvidenceMutationVariables,
  DeleteEvidenceMutation,
  DeleteEvidenceMutationVariables,
  GetRenewEvidenceQuery,
  GetRenewEvidenceQueryVariables,
  GetEvidenceListQuery,
  EvidenceOrder,
  Evidence,
  GetEvidenceTrendDataQuery,
  GetProgramEvidenceTrendDataQuery,
  EvidenceEvidenceStatus,
  GetEvidencesByStatusQuery,
  GetEvidenceFilesByIdQuery,
  GetEvidenceCountsByStatusAllProgramsQuery,
  EvidenceSuggestedActionsQuery,
  FileWhereInput,
  GetItemsMissingEvidenceCountQuery,
  GetEvidenceCommentsQuery,
  GetEvidenceCommentsQueryVariables,
  UpdateEvidenceCommentMutation,
  UpdateEvidenceCommentMutationVariables,
  CreateBulkCsvEvidenceMutation,
  CreateBulkCsvEvidenceMutationVariables,
  DeleteBulkEvidenceMutation,
  DeleteBulkEvidenceMutationVariables,
  UpdateBulkEvidenceMutation,
  UpdateBulkEvidenceMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'

export function useCreateEvidence() {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateEvidenceMutation, unknown, CreateEvidenceMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_EVIDENCE, variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['getEvidenceFiles'] }),
  })
}

type TEvidenceFilesProps = {
  pagination?: TPagination
  where?: FileWhereInput
}

export function useGetEvidenceFiles({ where, pagination }: TEvidenceFilesProps) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetEvidenceFilesQuery>({
    queryKey: ['getEvidenceFiles', where, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request<GetEvidenceFilesQuery>(GET_EVIDENCE_FILES, {
        where,
        ...pagination?.query,
      }),
  })

  const files = queryResult.data?.files?.edges?.map((edge) => edge?.node) ?? []

  const paginationMeta = {
    totalCount: queryResult.data?.files?.totalCount ?? 0,
    pageInfo: queryResult.data?.files?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    files,
    paginationMeta,
  }
}

export const useGetAllEvidences = (where?: EvidenceWhereInput) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllEvidencesQuery>({
    queryKey: ['evidences', where],
    queryFn: async () => client.request<GetAllEvidencesQuery>(GET_ALL_EVIDENCES, { where }),
  })

  const files = queryResult.data?.evidences?.edges?.map((edge) => edge?.node) ?? []

  const paginationMeta = {
    totalCount: queryResult.data?.evidences?.totalCount ?? 0,
    pageInfo: queryResult.data?.evidences?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    files,
    paginationMeta,
  }
}

export const useGetEvidenceById = (evidenceId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetEvidenceQuery, unknown>({
    queryKey: ['evidences', evidenceId],
    queryFn: async () => client.request(GET_EVIDENCE, { evidenceId }),
    enabled: !!evidenceId,
  })
}

export const useGetRenewEvidenceById = (evidenceId?: string | null, enabled: boolean = true) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetRenewEvidenceQuery, GetRenewEvidenceQueryVariables>({
    queryKey: ['getRenewEvidenceById', evidenceId],
    queryFn: async () => client.request(GET_RENEW_EVIDENCE, { evidenceId }),
    enabled: enabled && !!evidenceId,
  })

  const evidence = queryResult.data?.evidence

  return {
    ...queryResult,
    evidence,
  }
}

type EvidencePaginationArgs = {
  evidenceId?: string | null
  orderBy?: InputMaybe<Array<FileOrder> | FileOrder>
  pagination?: TPagination
}

export const useGetEvidenceWithFilesPaginated = ({ evidenceId, orderBy, pagination }: EvidencePaginationArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetEvidenceFilesPaginatedQuery, unknown>({
    queryKey: ['evidenceFiles', evidenceId, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request(GET_EVIDENCE_FILES_PAGINATED, {
        evidenceId,
        orderBy,
        ...pagination?.query,
      }),
    enabled: !!evidenceId,
  })

  const evidence = queryResult.data?.evidence
  const files = evidence?.files?.edges?.map((edge) => edge?.node) ?? []
  const pageInfo = evidence?.files?.pageInfo
  const totalCount = evidence?.files?.totalCount

  return {
    ...queryResult,
    evidence,
    files,
    pageInfo,
    totalCount,
  }
}

export const useUpdateEvidence = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateEvidenceMutation, unknown, UpdateEvidenceMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_EVIDENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidences'] })
    },
  })
}

export function useUploadEvidenceFiles() {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateEvidenceMutation, unknown, UpdateEvidenceMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_EVIDENCE, variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evidenceFiles'] }),
  })
}

export const useDeleteEvidence = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteEvidenceMutation, unknown, DeleteEvidenceMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_EVIDENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidences'] })
    },
  })
}

type TGetEvidenceListProps = {
  orderBy?: EvidenceOrder | EvidenceOrder[]
  pagination?: TPagination
  where?: EvidenceWhereInput
  enabled?: boolean
}

export const useGetEvidenceList = ({ orderBy, pagination, where, enabled = true }: TGetEvidenceListProps) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetEvidenceListQuery, unknown>({
    queryKey: ['evidences', orderBy, pagination?.page, pagination?.pageSize, where],
    queryFn: async () =>
      client.request(GET_EVIDENCE_LIST, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const evidences = (queryResult.data?.evidences?.edges?.map((edge) => edge?.node) ?? []) as Evidence[]

  const paginationMeta = {
    totalCount: queryResult.data?.evidences?.totalCount ?? 0,
    pageInfo: queryResult.data?.evidences?.pageInfo,
    isLoading: queryResult.isFetching,
  }
  return {
    ...queryResult,
    evidences,
    paginationMeta,
  }
}

export const useGetEvidenceCountsByStatus = (programId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetEvidenceCountsByStatusAllProgramsQuery, unknown>({
    queryKey: ['evidences', 'counts', programId],
    queryFn: async () => {
      if (programId) return client.request(GET_EVIDENCE_COUNTS_BY_STATUS_BY_PROGRAM_ID, { programId })
      return client.request(GET_EVIDENCE_COUNTS_BY_STATUS_ALL_PROGRAMS)
    },
  })
}

export const useEvidenceTrend = (programId?: string | null, status?: EvidenceEvidenceStatus) => {
  const { client } = useGraphQLClient()

  // Calculate date ranges for current week and previous week
  const now = new Date()
  const currentWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const previousWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  return useQuery({
    queryKey: ['evidence-trend', programId, status],
    queryFn: async () => {
      if (!status) {
        return {
          trend: 0,
          trendType: 'flat' as const,
          currentWeekCount: 0,
          previousWeekCount: 0,
        }
      }

      if (programId) {
        const variables = { programId, currentWeekStart, previousWeekStart, previousWeekEnd, status }
        const data = await client.request<GetProgramEvidenceTrendDataQuery>(GET_PROGRAM_EVIDENCE_TREND_DATA, variables)
        const currentWeekCount = data.currentWeek.totalCount
        const previousWeekCount = data.previousWeek.totalCount
        // Calculate trend percentage
        let trend = 0
        let trendType: 'up' | 'down' | 'flat' = 'flat'
        if (previousWeekCount > 0) {
          trend = ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100
          if (trend > 0) {
            trendType = 'up'
          } else if (trend < 0) {
            trendType = 'down'
          } else {
            trendType = 'flat'
          }
        } else if (currentWeekCount > 0) {
          trend = 100
          trendType = 'up'
        } else {
          trendType = 'flat'
        }
        return {
          trend: Math.round(trend),
          trendType,
          currentWeekCount,
          previousWeekCount,
        }
      } else {
        const variables = { currentWeekStart, previousWeekStart, previousWeekEnd, status }
        const data = await client.request<GetEvidenceTrendDataQuery>(GET_EVIDENCE_TREND_DATA, variables)
        const currentWeekCount = data.currentWeek.totalCount
        const previousWeekCount = data.previousWeek.totalCount
        // Calculate trend percentage
        let trend = 0
        let trendType: 'up' | 'down' | 'flat' = 'flat'
        if (previousWeekCount > 0) {
          trend = ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100
          if (trend > 0) {
            trendType = 'up'
          } else if (trend < 0) {
            trendType = 'down'
          } else {
            trendType = 'flat'
          }
        } else if (currentWeekCount > 0) {
          trend = 100
          trendType = 'up'
        } else {
          trendType = 'flat'
        }
        return {
          trend: Math.round(trend),
          trendType,
          currentWeekCount,
          previousWeekCount,
        }
      }
    },
    enabled: !!status,
  })
}

// Convenience hooks for specific statuses
export const useSubmittedEvidenceTrend = (programId?: string | null) => {
  return useEvidenceTrend(programId, EvidenceEvidenceStatus.READY_FOR_AUDITOR)
}

export const useAcceptedEvidenceTrend = (programId?: string | null) => {
  return useEvidenceTrend(programId, EvidenceEvidenceStatus.AUDITOR_APPROVED)
}

export const useRejectedEvidenceTrend = (programId?: string | null) => {
  return useEvidenceTrend(programId, EvidenceEvidenceStatus.REJECTED)
}

type TGetFirstFiveEvidenceByStatusProps = {
  where?: EvidenceWhereInput
}

export const useGetFirstFiveEvidencesByStatus = ({ where }: TGetFirstFiveEvidenceByStatusProps) => {
  const { client } = useGraphQLClient()

  return useQuery<GetEvidencesByStatusQuery, unknown>({
    queryKey: ['evidences', where],
    queryFn: async () => client.request(GET_FIRST_FIVE_EVIDENCES_BY_STATUS, { where }),
  })
}

export const useGetEvidenceFilesById = (evidenceId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetEvidenceFilesByIdQuery, unknown>({
    queryKey: ['evidences', 'files', evidenceId],
    queryFn: async () => client.request(GET_EVIDENCE_FILES_BY_ID, { evidenceId }),
    enabled: !!evidenceId,
  })
}

export const useEvidenceSuggestedActions = () => {
  const { client } = useGraphQLClient()

  return useQuery<EvidenceSuggestedActionsQuery, unknown>({
    queryKey: ['evidences', 'suggested-actions'],
    queryFn: async () => client.request(GET_EVIDENCE_SUGGESTED_ACTIONS),
    refetchOnWindowFocus: false,
  })
}

export const useGetEvidenceMissingArtifactCount = () => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetItemsMissingEvidenceCountQuery, unknown>({
    queryKey: ['evidences', 'evidenceMissingArtifactCount'],
    queryFn: async () => client.request(GET_EVIDENCE_ITEMS_MISSING_ARTIFACT_COUNT),
    enabled: true,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.evidences?.totalCount ?? 0,
  }
}

export const useGetEvidenceComments = (evidenceId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetEvidenceCommentsQuery, unknown>({
    queryKey: ['evidenceComments', evidenceId],
    queryFn: async () => client.request<GetEvidenceCommentsQuery, GetEvidenceCommentsQueryVariables>(GET_EVIDENCE_COMMENTS, { evidenceId: evidenceId! }),
    enabled: !!evidenceId,
  })
}

export const useUpdateEvidenceComment = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateEvidenceCommentMutation, unknown, UpdateEvidenceCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_EVIDENCE_COMMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidenceComments'] })
    },
  })
}

export const useCreateBulkCSVEvidence = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvEvidenceMutation, unknown, CreateBulkCsvEvidenceMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_EVIDENCE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidences'] })
    },
  })
}

export const useBulkDeleteEvidence = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkEvidenceMutation, unknown, DeleteBulkEvidenceMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_EVIDENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidences'] })
    },
  })
}

export const useBulkEditEvidence = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkEvidenceMutation, unknown, UpdateBulkEvidenceMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_EVIDENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidences'] })
    },
  })
}
