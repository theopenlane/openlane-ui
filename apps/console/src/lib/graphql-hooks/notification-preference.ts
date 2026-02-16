import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  NotificationPreference,
  NotificationPreferenceQuery,
  NotificationPreferenceQueryVariables,
  NotificationPreferencesWithFilterQuery,
  NotificationPreferencesWithFilterQueryVariables,
  CreateNotificationPreferenceMutation,
  CreateNotificationPreferenceMutationVariables,
  CreateBulkCsvNotificationPreferenceMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteNotificationPreferenceMutation,
  DeleteNotificationPreferenceMutationVariables,
  DeleteBulkNotificationPreferenceMutation,
  DeleteBulkNotificationPreferenceMutationVariables,
  UpdateNotificationPreferenceMutation,
  UpdateNotificationPreferenceMutationVariables,
  UpdateBulkNotificationPreferenceMutation,
  UpdateBulkNotificationPreferenceMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  NOTIFICATION_PREFERENCE,
  GET_ALL_NOTIFICATION_PREFERENCES,
  BULK_DELETE_NOTIFICATION_PREFERENCE,
  CREATE_NOTIFICATION_PREFERENCE,
  CREATE_CSV_BULK_NOTIFICATION_PREFERENCE,
  DELETE_NOTIFICATION_PREFERENCE,
  UPDATE_NOTIFICATION_PREFERENCE,
  BULK_EDIT_NOTIFICATION_PREFERENCE,
} from '@repo/codegen/query/notification-preference'

type GetAllNotificationPreferencesArgs = {
  where?: NotificationPreferencesWithFilterQueryVariables['where']
  orderBy?: NotificationPreferencesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useNotificationPreferencesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllNotificationPreferencesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<NotificationPreferencesWithFilterQuery, unknown>({
    queryKey: ['notificationPreferences', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<NotificationPreferencesWithFilterQuery> => {
      const result = await client.request(GET_ALL_NOTIFICATION_PREFERENCES, { where, orderBy, ...pagination?.query })
      return result as NotificationPreferencesWithFilterQuery
    },
    enabled,
  })

  const NotificationPreferences = (queryResult.data?.notificationPreferences?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as NotificationPreference[]

  return { ...queryResult, NotificationPreferences }
}

export const useCreateNotificationPreference = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateNotificationPreferenceMutation, unknown, CreateNotificationPreferenceMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_NOTIFICATION_PREFERENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    },
  })
}

export const useUpdateNotificationPreference = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateNotificationPreferenceMutation, unknown, UpdateNotificationPreferenceMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_NOTIFICATION_PREFERENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    },
  })
}

export const useDeleteNotificationPreference = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteNotificationPreferenceMutation, unknown, DeleteNotificationPreferenceMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_NOTIFICATION_PREFERENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    },
  })
}

export const useNotificationPreference = (notificationPreferenceId?: NotificationPreferenceQueryVariables['notificationPreferenceId']) => {
  const { client } = useGraphQLClient()

  return useQuery<NotificationPreferenceQuery, unknown>({
    queryKey: ['notificationPreferences', notificationPreferenceId],
    queryFn: async (): Promise<NotificationPreferenceQuery> => {
      const result = await client.request(NOTIFICATION_PREFERENCE, { notificationPreferenceId })
      return result as NotificationPreferenceQuery
    },
    enabled: !!notificationPreferenceId,
  })
}

export const useCreateBulkCSVNotificationPreference = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvNotificationPreferenceMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_NOTIFICATION_PREFERENCE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    },
  })
}

export const useBulkEditNotificationPreference = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkNotificationPreferenceMutation, unknown, UpdateBulkNotificationPreferenceMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_NOTIFICATION_PREFERENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    },
  })
}

export const useBulkDeleteNotificationPreference = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkNotificationPreferenceMutation, unknown, DeleteBulkNotificationPreferenceMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_NOTIFICATION_PREFERENCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
    },
  })
}
