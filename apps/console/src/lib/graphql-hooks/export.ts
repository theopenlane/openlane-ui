import { useGraphQLClient } from '@/hooks/useGraphQLClient.ts'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CreateExportMutation, CreateExportMutationVariables, ExportWhereInput, GetExportQuery, GetExportQueryVariables, GetExportsQuery } from '@repo/codegen/src/schema.ts'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { CREATE_EXPORT, GET_EXPORT, GET_EXPORTS } from '@repo/codegen/query/export.ts'

export enum ExportKeyEnum {
  POLICIES = 'policies',
}

export function useCreateExport() {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateExportMutation, unknown, CreateExportMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_EXPORT, variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exports'] }),
  })
}

export const useGetExport = (exportId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetExportQuery, GetExportQueryVariables>({
    queryKey: ['exports', exportId],
    queryFn: () => client.request(GET_EXPORT, { exportId }),
    enabled: !!exportId,
  })
}

export const useGetAllExports = (where?: ExportWhereInput) => {
  const { client } = useGraphQLClient()

  return useQuery<GetExportsQuery>({
    queryKey: ['exports', where],
    queryFn: async () => client.request<GetExportsQuery>(GET_EXPORTS, { where }),
  })
}
