import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GroupSetting,
  GroupSettingQuery,
  GroupSettingQueryVariables,
  GroupSettingsWithFilterQuery,
  GroupSettingsWithFilterQueryVariables,
  CreateGroupSettingMutation,
  CreateGroupSettingMutationVariables,
  CreateBulkCsvGroupSettingMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteGroupSettingMutation,
  DeleteGroupSettingMutationVariables,
  DeleteBulkGroupSettingMutation,
  DeleteBulkGroupSettingMutationVariables,
  UpdateGroupSettingMutation,
  UpdateGroupSettingMutationVariables,
  UpdateBulkGroupSettingMutation,
  UpdateBulkGroupSettingMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  GROUP_SETTING,
  GET_ALL_GROUP_SETTINGS,
  BULK_DELETE_GROUP_SETTING,
  CREATE_GROUP_SETTING,
  CREATE_CSV_BULK_GROUP_SETTING,
  DELETE_GROUP_SETTING,
  UPDATE_GROUP_SETTING,
  BULK_EDIT_GROUP_SETTING,
} from '@repo/codegen/query/group-setting'

type GetAllGroupSettingsArgs = {
  where?: GroupSettingsWithFilterQueryVariables['where']
  orderBy?: GroupSettingsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useGroupSettingsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllGroupSettingsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GroupSettingsWithFilterQuery, unknown>({
    queryKey: ['groupSettings', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<GroupSettingsWithFilterQuery> => {
      const result = await client.request(GET_ALL_GROUP_SETTINGS, { where, orderBy, ...pagination?.query })
      return result as GroupSettingsWithFilterQuery
    },
    enabled,
  })

  const GroupSettings = (queryResult.data?.groupSettings?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as GroupSetting[]

  return { ...queryResult, GroupSettings }
}

export const useCreateGroupSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateGroupSettingMutation, unknown, CreateGroupSettingMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_GROUP_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSettings'] })
    },
  })
}

export const useUpdateGroupSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateGroupSettingMutation, unknown, UpdateGroupSettingMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_GROUP_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSettings'] })
    },
  })
}

export const useDeleteGroupSetting = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteGroupSettingMutation, unknown, DeleteGroupSettingMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_GROUP_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSettings'] })
    },
  })
}

export const useGroupSetting = (groupSettingId?: GroupSettingQueryVariables['groupSettingId']) => {
  const { client } = useGraphQLClient()

  return useQuery<GroupSettingQuery, unknown>({
    queryKey: ['groupSettings', groupSettingId],
    queryFn: async (): Promise<GroupSettingQuery> => {
      const result = await client.request(GROUP_SETTING, { groupSettingId })
      return result as GroupSettingQuery
    },
    enabled: !!groupSettingId,
  })
}

export const useCreateBulkCSVGroupSetting = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvGroupSettingMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_GROUP_SETTING, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSettings'] })
    },
  })
}

export const useBulkEditGroupSetting = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkGroupSettingMutation, unknown, UpdateBulkGroupSettingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_GROUP_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSettings'] })
    },
  })
}

export const useBulkDeleteGroupSetting = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkGroupSettingMutation, unknown, DeleteBulkGroupSettingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_GROUP_SETTING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSettings'] })
    },
  })
}
