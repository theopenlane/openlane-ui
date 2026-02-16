import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  NotificationTemplate,
  NotificationTemplateQuery,
  NotificationTemplateQueryVariables,
  NotificationTemplatesWithFilterQuery,
  NotificationTemplatesWithFilterQueryVariables,
  CreateNotificationTemplateMutation,
  CreateNotificationTemplateMutationVariables,
  CreateBulkCsvNotificationTemplateMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteNotificationTemplateMutation,
  DeleteNotificationTemplateMutationVariables,
  DeleteBulkNotificationTemplateMutation,
  DeleteBulkNotificationTemplateMutationVariables,
  UpdateNotificationTemplateMutation,
  UpdateNotificationTemplateMutationVariables,
  UpdateBulkNotificationTemplateMutation,
  UpdateBulkNotificationTemplateMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  NOTIFICATION_TEMPLATE,
  GET_ALL_NOTIFICATION_TEMPLATES,
  BULK_DELETE_NOTIFICATION_TEMPLATE,
  CREATE_NOTIFICATION_TEMPLATE,
  CREATE_CSV_BULK_NOTIFICATION_TEMPLATE,
  DELETE_NOTIFICATION_TEMPLATE,
  UPDATE_NOTIFICATION_TEMPLATE,
  BULK_EDIT_NOTIFICATION_TEMPLATE,
} from '@repo/codegen/query/notification-template'

type GetAllNotificationTemplatesArgs = {
  where?: NotificationTemplatesWithFilterQueryVariables['where']
  orderBy?: NotificationTemplatesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useNotificationTemplatesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllNotificationTemplatesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<NotificationTemplatesWithFilterQuery, unknown>({
    queryKey: ['notificationTemplates', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<NotificationTemplatesWithFilterQuery> => {
      const result = await client.request(GET_ALL_NOTIFICATION_TEMPLATES, { where, orderBy, ...pagination?.query })
      return result as NotificationTemplatesWithFilterQuery
    },
    enabled,
  })

  const NotificationTemplates = (queryResult.data?.notificationTemplates?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as NotificationTemplate[]

  return { ...queryResult, NotificationTemplates }
}

export const useCreateNotificationTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateNotificationTemplateMutation, unknown, CreateNotificationTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_NOTIFICATION_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] })
    },
  })
}

export const useUpdateNotificationTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateNotificationTemplateMutation, unknown, UpdateNotificationTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_NOTIFICATION_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] })
    },
  })
}

export const useDeleteNotificationTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteNotificationTemplateMutation, unknown, DeleteNotificationTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_NOTIFICATION_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] })
    },
  })
}

export const useNotificationTemplate = (notificationTemplateId?: NotificationTemplateQueryVariables['notificationTemplateId']) => {
  const { client } = useGraphQLClient()

  return useQuery<NotificationTemplateQuery, unknown>({
    queryKey: ['notificationTemplates', notificationTemplateId],
    queryFn: async (): Promise<NotificationTemplateQuery> => {
      const result = await client.request(NOTIFICATION_TEMPLATE, { notificationTemplateId })
      return result as NotificationTemplateQuery
    },
    enabled: !!notificationTemplateId,
  })
}

export const useCreateBulkCSVNotificationTemplate = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvNotificationTemplateMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_NOTIFICATION_TEMPLATE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] })
    },
  })
}

export const useBulkEditNotificationTemplate = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkNotificationTemplateMutation, unknown, UpdateBulkNotificationTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_NOTIFICATION_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] })
    },
  })
}

export const useBulkDeleteNotificationTemplate = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkNotificationTemplateMutation, unknown, DeleteBulkNotificationTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_NOTIFICATION_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] })
    },
  })
}
