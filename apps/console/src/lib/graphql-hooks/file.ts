import { useQuery } from '@tanstack/react-query'
import { GET_FILES } from '@repo/codegen/query/file'
import { GetFilesQuery, FileWhereInput } from '@repo/codegen/src/schema'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TPagination } from '@repo/ui/pagination-types'

type TGetFilesProps = {
  pagination?: TPagination
  where?: FileWhereInput
}

export function useGetFiles({ where, pagination }: TGetFilesProps) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetFilesQuery>({
    queryKey: ['getFiles', where, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request<GetFilesQuery>(GET_FILES, {
        where,
        ...pagination?.query,
      }),
  })

  const files = queryResult.data?.files?.edges?.map((edge) => edge?.node) ?? []

  const paginationMeta = {
    totalCount: queryResult.data?.files?.totalCount ?? 0,
    pageInfo: queryResult.data?.files?.pageInfo,
    isLoading: queryResult.isLoading,
  }

  return {
    ...queryResult,
    files,
    paginationMeta,
  }
}
