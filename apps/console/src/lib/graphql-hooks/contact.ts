import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_CONTACTS } from '@repo/codegen/query/contact'
import { GetContactsQuery, GetContactsQueryVariables, ContactWhereInput, ContactUserStatus } from '@repo/codegen/src/schema'

type UseContactsArgs = {
  where?: ContactWhereInput
  enabled?: boolean
}

type ContactNode = NonNullable<NonNullable<NonNullable<GetContactsQuery['contacts']['edges']>[number]>['node']>

export const useContacts = ({ where, enabled = true }: UseContactsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetContactsQuery, GetContactsQueryVariables>({
    queryKey: ['contacts', where],
    queryFn: () =>
      client.request(GET_CONTACTS, {
        where: {
          ...where,
          status: ContactUserStatus.ACTIVE,
        },
        first: 20,
      }),
    enabled,
  })

  const contacts = useMemo(() => (queryResult.data?.contacts?.edges ?? []).map((edge) => edge?.node).filter(Boolean) as ContactNode[], [queryResult.data?.contacts?.edges])

  return {
    ...queryResult,
    contacts,
    isLoading: queryResult.isFetching,
  }
}
