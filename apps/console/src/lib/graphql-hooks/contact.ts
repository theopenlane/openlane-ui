import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Contact,
  ContactQuery,
  ContactQueryVariables,
  ContactsWithFilterQuery,
  ContactsWithFilterQueryVariables,
  CreateContactMutation,
  CreateContactMutationVariables,
  CreateBulkCsvContactMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteContactMutation,
  DeleteContactMutationVariables,
  DeleteBulkContactMutation,
  DeleteBulkContactMutationVariables,
  UpdateContactMutation,
  UpdateContactMutationVariables,
  UpdateBulkContactMutation,
  UpdateBulkContactMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { CONTACT, GET_ALL_CONTACTS, BULK_DELETE_CONTACT, CREATE_CONTACT, CREATE_CSV_BULK_CONTACT, DELETE_CONTACT, UPDATE_CONTACT, BULK_EDIT_CONTACT } from '@repo/codegen/query/contact'

type GetAllContactsArgs = {
  where?: ContactsWithFilterQueryVariables['where']
  orderBy?: ContactsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useContactsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllContactsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<ContactsWithFilterQuery, unknown>({
    queryKey: ['contacts', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ContactsWithFilterQuery> => {
      const result = await client.request(GET_ALL_CONTACTS, { where, orderBy, ...pagination?.query })
      return result as ContactsWithFilterQuery
    },
    enabled,
  })

  const Contacts = (queryResult.data?.contacts?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Contact[]

  return { ...queryResult, Contacts }
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

  return useMutation<CreateBulkCsvContactMutation, unknown, CreateBulkCsvTaskMutationVariables>({
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
