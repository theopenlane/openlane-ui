import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_EVIDENCE, DELETE_EVIDENCE, GET_ALL_EVIDENCES, GET_EVIDENCE, GET_EVIDENCE_FILES, GET_EVIDENCE_FILES_PAGINATED, UPDATE_EVIDENCE } from '@repo/codegen/query/evidence'
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
