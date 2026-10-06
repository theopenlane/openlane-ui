import { useMemo } from 'react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient.ts'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  type CreateExportMutation,
  type CreateExportMutationVariables,
  ExportExportStatus,
  type ExportWhereInput,
  type GetExportFileContentQuery,
  type GetExportFileContentQueryVariables,
  type GetExportQuery,
  type GetExportQueryVariables,
  type GetExportsQuery,
} from '@repo/codegen/src/schema.ts'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { delay } from '@/utils/async'
import { CREATE_EXPORT, GET_EXPORT, GET_EXPORT_FILE_CONTENT, GET_EXPORTS } from '@repo/codegen/query/export.ts'

export function useCreateExport() {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateExportMutation, unknown, CreateExportMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_EXPORT, variables }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exports'] }),
  })
}

const EXPORT_POLL_INTERVAL_MS = 2000 // 2s
const EXPORT_TIMEOUT_MS = 3 * 60 * 1000 // 3min

export type TExportFile = NonNullable<NonNullable<NonNullable<GetExportQuery['export']['files']['edges']>[number]>['node']>

export const useExportFile = () => {
  const { client } = useGraphQLClient()

  return useMemo(
    () => ({
      waitForExportFile: async (exportId: string, signal: AbortSignal): Promise<TExportFile> => {
        const deadline = Date.now() + EXPORT_TIMEOUT_MS
        while (Date.now() < deadline) {
          const { export: exportRecord } = await client.request<GetExportQuery, GetExportQueryVariables>({ document: GET_EXPORT, variables: { exportId }, signal })
          signal.throwIfAborted()

          if (exportRecord.status === ExportExportStatus.READY) {
            const file = getNodes(exportRecord.files)[0]
            if (!file) throw new UserFacingError('The export finished without producing a file. Please try again later.')
            return file
          }
          if (exportRecord.status === ExportExportStatus.NODATA) throw new UserFacingError('There was nothing to export.')
          if (exportRecord.status === ExportExportStatus.FAILED) {
            throw new UserFacingError('The export failed. Please try again later.', { cause: exportRecord.errorMessage })
          }

          await delay(EXPORT_POLL_INTERVAL_MS, signal)
        }
        throw new UserFacingError('The export is taking longer than expected. Please try again later.')
      },
      fetchExportFileContent: async (fileId: string, signal: AbortSignal) => {
        const { file } = await client.request<GetExportFileContentQuery, GetExportFileContentQueryVariables>({ document: GET_EXPORT_FILE_CONTENT, variables: { fileId }, signal })
        return file.base64 ?? null
      },
    }),
    [client],
  )
}

export type GetExportsQueryNode = NonNullable<NonNullable<NonNullable<GetExportsQuery['exports']['edges']>[number]>['node']>

export const useGetAllExports = ({ where, enabled = true }: { where?: ExportWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetExportsQuery>({
    queryKey: ['exports', where],
    queryFn: async () => client.request<GetExportsQuery>(GET_EXPORTS, { where }),
    enabled,
  })
}
