import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GET_FILES } from '@repo/codegen/query/file'
import { type GetFilesQuery, type FileOrder, type FileWhereInput } from '@repo/codegen/src/schema'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type TPagination } from '@repo/ui/pagination-types'

type TGetFilesProps = {
  pagination?: TPagination
  where?: FileWhereInput
  orderBy?: FileOrder | FileOrder[]
}

export const useGetFiles = ({ where, orderBy, pagination }: TGetFilesProps) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetFilesQuery>({
    queryKey: ['getFiles', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request<GetFilesQuery>(GET_FILES, {
        where,
        orderBy,
        ...pagination?.query,
      }),
  })

  const { data, isLoading } = queryResult

  const files = useMemo(() => data?.files?.edges?.map((edge) => edge?.node) ?? [], [data])

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.files?.totalCount ?? 0,
      pageInfo: data?.files?.pageInfo,
      isLoading,
    }),
    [data, isLoading],
  )

  return {
    ...queryResult,
    files,
    paginationMeta,
  }
}
