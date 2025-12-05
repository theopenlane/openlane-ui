import { useQuery } from '@tanstack/react-query'
import { Option } from '@repo/ui/multiple-selector'
import { CustomTypeEnumWhereInput, GetCustomTypeEnumsQuery } from '@repo/codegen/src/schema'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_CUSTOM_TYPE_ENUMS } from '@repo/codegen/query/custom-type-enum'

type UseGetCustomTypeEnumsProps = {
  where?: CustomTypeEnumWhereInput
}

export const useGetCustomTypeEnums = ({ where }: UseGetCustomTypeEnumsProps = {}) => {
  const { client } = useGraphQLClient()

  const query = useQuery<GetCustomTypeEnumsQuery>({
    queryKey: ['customTypeEnums', where],
    queryFn: () => client.request<GetCustomTypeEnumsQuery>(GET_CUSTOM_TYPE_ENUMS, { where }),
  })

  const enumOptions: (Option & { color?: string; description: string })[] =
    query.data?.customTypeEnums?.edges?.map((edge) => ({
      value: edge?.node?.name || '',
      label: edge?.node?.name || '',
      color: edge?.node?.color ?? undefined,
      description: edge?.node?.description ?? '',
    })) ?? []

  return {
    ...query,
    enumOptions,
  }
}
