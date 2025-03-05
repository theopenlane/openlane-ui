import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_EVIDENCE, GET_EVIDENCE_FILES } from '@repo/codegen/query/evidence'
import { CreateEvidenceMutation, CreateEvidenceMutationVariables, GetEvidenceFilesQuery } from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export function useCreateEvidence() {
  const { client, queryClient } = useGraphQLClient()

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
