import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_EVIDENCE, GET_EVIDENCE_FILES } from '@repo/codegen/query/evidence'
import { CreateEvidenceMutation, CreateEvidenceMutationVariables, GetEvidenceFilesQuery } from '@repo/codegen/src/schema'

export function useCreateEvidence() {
  const { client } = useGraphQLClient()

  return useMutation<CreateEvidenceMutation, unknown, CreateEvidenceMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_EVIDENCE, variables),
  })
}

export function useGetEvidenceFiles() {
  const { client } = useGraphQLClient()

  return useQuery<GetEvidenceFilesQuery>({
    queryKey: ['getEvidenceFiles'],
    queryFn: async () => client.request<GetEvidenceFilesQuery>(GET_EVIDENCE_FILES),
  })
}
