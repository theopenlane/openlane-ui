import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_TAGS } from '@repo/codegen/query/tags'
import { GetTagsQuery } from '@repo/codegen/src/schema'
import { Option } from '@repo/ui/multiple-selector'
import { useQuery } from '@tanstack/react-query'

export const useGetTags = () => {
  const { client } = useGraphQLClient()

  const query = useQuery<GetTagsQuery>({
    queryKey: ['tags'],
    queryFn: () => client.request<GetTagsQuery>(GET_TAGS),
  })

  const tagOptions: Option[] =
    query.data?.tagDefinitions?.edges?.map((edge) => ({
      value: edge?.node?.name || '',
      label: edge?.node?.name || '',
    })) ?? []

  return {
    ...query,
    tagOptions,
  }
}
