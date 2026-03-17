import { useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_CONTACTS, CONTACT, UPDATE_CONTACT, CREATE_CSV_BULK_CONTACT, BULK_DELETE_CONTACT, BULK_EDIT_CONTACT } from '@repo/codegen/query/contact'
import {
  type GetContactsQuery,
  type GetContactsQueryVariables,
  type ContactWhereInput,
  type ContactQuery,
  type ContactQueryVariables,
  type UpdateContactInput,
  type UpdateContactMutation,
  type CreateBulkCsvContactMutation,
  type CreateBulkCsvContactMutationVariables,
  type DeleteBulkContactMutation,
  type DeleteBulkContactMutationVariables,
  type UpdateBulkContactMutation,
  type UpdateBulkContactMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'

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
        where,
        first: 20,
      }),
    enabled,
  })

  const contacts = useMemo(() => (queryResult.data?.contacts?.edges ?? []).map((edge) => edge?.node).filter(Boolean) as ContactNode[], [queryResult.data?.contacts?.edges])

  return {
    ...queryResult,
    contacts,
    isLoading: queryResult.isLoading,
  }
}

export const useContact = (contactId: string | null) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<ContactQuery, ContactQueryVariables>({
    queryKey: ['contacts', contactId],
    queryFn: () => client.request(CONTACT, { contactId: contactId }),
    enabled: !!contactId,
  })

  return {
    ...queryResult,
    contact: queryResult.data?.contact ?? null,
  }
}

export const useUpdateContact = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateContactMutation, unknown, { id: string; input: UpdateContactInput }>({
    mutationFn: async ({ id, input }) => client.request(UPDATE_CONTACT, { updateContactId: id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export const useCreateBulkCSVContact = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvContactMutation, unknown, CreateBulkCsvContactMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_CONTACT, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export const useBulkDeleteContact = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkContactMutation, unknown, DeleteBulkContactMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_CONTACT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export const useBulkEditContact = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkContactMutation, unknown, UpdateBulkContactMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_CONTACT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
