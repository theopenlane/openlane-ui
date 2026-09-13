import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GET_FILES } from '@repo/codegen/query/file'
import { type GetFilesQuery, type FileOrder, type FileWhereInput } from '@repo/codegen/src/schema'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type TPagination, type TPaginationQuery } from '@repo/ui/pagination-types'

type TGetFilesProps = {
  pagination?: TPagination
  where?: FileWhereInput
  orderBy?: FileOrder | FileOrder[]
}

const getFilesQueryKey = (where: FileWhereInput | undefined, orderBy: TGetFilesProps['orderBy'], page: number | undefined, pageSize: number | undefined) => ['getFiles', where, orderBy, page, pageSize]

export const useGetFiles = ({ where, orderBy, pagination }: TGetFilesProps) => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  const page = pagination?.page
  const pageSize = pagination?.pageSize

  const fetchFiles = useCallback((query: TPaginationQuery) => client.request<GetFilesQuery>(GET_FILES, { where, orderBy, ...query }), [client, where, orderBy])

  const queryResult = useQuery<GetFilesQuery>({
    queryKey: getFilesQueryKey(where, orderBy, page, pageSize),
    queryFn: async () => fetchFiles(pagination?.query ?? {}),
  })

  const { data, isFetching, isPlaceholderData } = queryResult

  const files = useMemo(() => data?.files?.edges?.map((edge) => edge?.node) ?? [], [data])

  const pageInfo = data?.files?.pageInfo
  const nextCursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null

  useEffect(() => {
    if (!nextCursor || isPlaceholderData || page === undefined || pageSize === undefined) {
      return
    }

    queryClient.prefetchQuery({
      queryKey: getFilesQueryKey(where, orderBy, page + 1, pageSize),
      queryFn: () => fetchFiles({ first: pageSize, after: nextCursor }),
      staleTime: 60 * 1000,
    })
  }, [nextCursor, isPlaceholderData, where, orderBy, page, pageSize, fetchFiles, queryClient])

  const paginationMeta = useMemo(
    () => ({
      pageInfo,
      isLoading: isFetching,
      unknownTotalCount: true,
    }),
    [pageInfo, isFetching],
  )

  return {
    ...queryResult,
    files,
    paginationMeta,
  }
}
