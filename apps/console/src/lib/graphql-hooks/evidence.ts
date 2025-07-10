import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_EVIDENCE,
  DELETE_EVIDENCE,
  GET_ALL_EVIDENCES,
  GET_EVIDENCE,
  GET_EVIDENCE_COUNTS_BY_STATUS,
  GET_EVIDENCE_FILES,
  GET_EVIDENCE_FILES_PAGINATED,
  GET_EVIDENCE_LIST,
  GET_RENEW_EVIDENCE,
  UPDATE_EVIDENCE,
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
  GetEvidenceCountsByStatusQuery,
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

export function useGetEvidenceFiles() {
  const { client } = useGraphQLClient()

  return useQuery<GetEvidenceFilesQuery>({
    queryKey: ['getEvidenceFiles'],
    queryFn: async () => client.request<GetEvidenceFilesQuery>(GET_EVIDENCE_FILES),
  })
}

export const useGetAllEvidences = (where?: EvidenceWhereInput) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllEvidencesQuery>({
    queryKey: ['evidences', where],
    queryFn: async () => client.request<GetAllEvidencesQuery>(GET_ALL_EVIDENCES, { where }),
  })
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
      queryClient.invalidateQueries({ queryKey: ['evidence'] })
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

  return useQuery<GetEvidenceCountsByStatusQuery, unknown>({
    queryKey: ['evidences', 'counts', programId],
    queryFn: async () => client.request(GET_EVIDENCE_COUNTS_BY_STATUS, { programId }),
    enabled: !!programId,
  })
}
