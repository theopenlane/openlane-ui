import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type GetContactsQuery,
  type GetContactsQueryVariables,
  type ContactWhereInput,
  type ContactsWithFilterQuery,
  type ContactsWithFilterQueryVariables,
  type CreateContactMutation,
  type CreateContactMutationVariables,
  type UpdateContactMutation,
  type UpdateContactMutationVariables,
  type DeleteContactMutation,
  type DeleteContactMutationVariables,
  type ContactQuery,
  type ContactQueryVariables,
  type CreateBulkCsvContactMutation,
  type CreateBulkCsvContactMutationVariables,
  type UpdateBulkContactMutation,
  type UpdateBulkContactMutationVariables,
  type DeleteBulkContactMutation,
  type DeleteBulkContactMutationVariables,
  ContactUserStatus,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import { GET_CONTACTS, GET_ALL_CONTACTS, CONTACT, CREATE_CONTACT, UPDATE_CONTACT, DELETE_CONTACT, CREATE_CSV_BULK_CONTACT, BULK_EDIT_CONTACT, BULK_DELETE_CONTACT } from '@repo/codegen/query/contact'

type ContactNode = NonNullable<NonNullable<NonNullable<GetContactsQuery['contacts']['edges']>[number]>['node']>

type UseContactsArgs = {
  where?: ContactWhereInput
  enabled?: boolean
  first?: number
}

export const useContacts = ({ where, enabled = true, first = 20 }: UseContactsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetContactsQuery, GetContactsQueryVariables>({
    queryKey: ['contacts', where, first],
    queryFn: () =>
      client.request(GET_CONTACTS, {
        where,
        first,
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

type GetAllContactsArgs = {
  where?: ContactsWithFilterQueryVariables['where']
  orderBy?: ContactsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ContactsNode = NonNullable<NonNullable<NonNullable<ContactsWithFilterQuery['contacts']>['edges']>[number]>['node']

export type ContactsNodeNonNull = NonNullable<ContactsNode>

export const useContactsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllContactsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ContactsWithFilterQuery, unknown>({
    queryKey: ['contacts', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ContactsWithFilterQuery> => {
      const result = await client.request<ContactsWithFilterQuery>(GET_ALL_CONTACTS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.contacts?.edges ?? []

  const contactsNodes: ContactsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ContactsNodeNonNull)
  const pageInfo = queryResult.data?.contacts?.pageInfo
  const totalCount = queryResult.data?.contacts?.totalCount ?? 0

  return { ...queryResult, contactsNodes, pageInfo, totalCount }
}

export const useCreateContact = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateContactMutation, unknown, CreateContactMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CONTACT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export const useUpdateContact = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateContactMutation, unknown, UpdateContactMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTACT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export const useDeleteContact = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteContactMutation, unknown, DeleteContactMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CONTACT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export const useContact = (contactId?: ContactQueryVariables['contactId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ContactQuery, unknown>({
    queryKey: ['contacts', contactId],
    queryFn: async (): Promise<ContactQuery> => {
      const result = await client.request(CONTACT, { contactId })
      return result as ContactQuery
    },
    enabled: !!contactId,
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

export const useBulkEditContact = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkContactMutation, unknown, UpdateBulkContactMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_CONTACT, variables),
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
