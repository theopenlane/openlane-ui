import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  ActionPlan,
  ActionPlanQuery,
  ActionPlanQueryVariables,
  ActionPlansWithFilterQuery,
  ActionPlansWithFilterQueryVariables,
  CreateActionPlanMutation,
  CreateActionPlanMutationVariables,
  CreateBulkCsvActionPlanMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteActionPlanMutation,
  DeleteActionPlanMutationVariables,
  DeleteBulkActionPlanMutation,
  DeleteBulkActionPlanMutationVariables,
  UpdateActionPlanMutation,
  UpdateActionPlanMutationVariables,
  UpdateBulkActionPlanMutation,
  UpdateBulkActionPlanMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  ACTION_PLAN,
  GET_ALL_ACTION_PLANS,
  BULK_DELETE_ACTION_PLAN,
  CREATE_ACTION_PLAN,
  CREATE_CSV_BULK_ACTION_PLAN,
  DELETE_ACTION_PLAN,
  UPDATE_ACTION_PLAN,
  BULK_EDIT_ACTION_PLAN,
} from '@repo/codegen/query/action-plan'

type GetAllActionPlansArgs = {
  where?: ActionPlansWithFilterQueryVariables['where']
  orderBy?: ActionPlansWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useActionPlansWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllActionPlansArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<ActionPlansWithFilterQuery, unknown>({
    queryKey: ['actionPlans', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ActionPlansWithFilterQuery> => {
      const result = await client.request(GET_ALL_ACTION_PLANS, { where, orderBy, ...pagination?.query })
      return result as ActionPlansWithFilterQuery
    },
    enabled,
  })

  const ActionPlans = (queryResult.data?.actionPlans?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as ActionPlan[]

  return { ...queryResult, ActionPlans }
}

export const useCreateActionPlan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateActionPlanMutation, unknown, CreateActionPlanMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_ACTION_PLAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionPlans'] })
    },
  })
}

export const useUpdateActionPlan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateActionPlanMutation, unknown, UpdateActionPlanMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_ACTION_PLAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionPlans'] })
    },
  })
}

export const useDeleteActionPlan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteActionPlanMutation, unknown, DeleteActionPlanMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_ACTION_PLAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionPlans'] })
    },
  })
}

export const useActionPlan = (actionPlanId?: ActionPlanQueryVariables['actionPlanId']) => {
  const { client } = useGraphQLClient()

  return useQuery<ActionPlanQuery, unknown>({
    queryKey: ['actionPlans', actionPlanId],
    queryFn: async (): Promise<ActionPlanQuery> => {
      const result = await client.request(ACTION_PLAN, { actionPlanId })
      return result as ActionPlanQuery
    },
    enabled: !!actionPlanId,
  })
}

export const useCreateBulkCSVActionPlan = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvActionPlanMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_ACTION_PLAN, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionPlans'] })
    },
  })
}

export const useBulkEditActionPlan = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkActionPlanMutation, unknown, UpdateBulkActionPlanMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_ACTION_PLAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionPlans'] })
    },
  })
}

export const useBulkDeleteActionPlan = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkActionPlanMutation, unknown, DeleteBulkActionPlanMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_ACTION_PLAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionPlans'] })
    },
  })
}
