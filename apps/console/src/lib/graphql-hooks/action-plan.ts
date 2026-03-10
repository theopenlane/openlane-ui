import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ActionPlansWithFilterQuery,
  type ActionPlansWithFilterQueryVariables,
  type CreateActionPlanMutation,
  type CreateActionPlanMutationVariables,
  type UpdateActionPlanMutation,
  type UpdateActionPlanMutationVariables,
  type DeleteActionPlanMutation,
  type DeleteActionPlanMutationVariables,
  type ActionPlanQuery,
  type ActionPlanQueryVariables,
  type CreateBulkCsvActionPlanMutation,
  type CreateBulkCsvActionPlanMutationVariables,
  type UpdateBulkActionPlanMutation,
  type UpdateBulkActionPlanMutationVariables,
  type DeleteBulkActionPlanMutation,
  type DeleteBulkActionPlanMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_ACTION_PLANS,
  CREATE_ACTION_PLAN,
  UPDATE_ACTION_PLAN,
  DELETE_ACTION_PLAN,
  ACTION_PLAN,
  CREATE_CSV_BULK_ACTION_PLAN,
  BULK_EDIT_ACTION_PLAN,
  BULK_DELETE_ACTION_PLAN,
} from '@repo/codegen/query/action-plan'

type GetAllActionPlansArgs = {
  where?: ActionPlansWithFilterQueryVariables['where']
  orderBy?: ActionPlansWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ActionPlansNode = NonNullable<NonNullable<NonNullable<ActionPlansWithFilterQuery['actionPlans']>['edges']>[number]>['node']

export type ActionPlansNodeNonNull = NonNullable<ActionPlansNode>

export const useActionPlansWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllActionPlansArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ActionPlansWithFilterQuery, unknown>({
    queryKey: ['actionPlans', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ActionPlansWithFilterQuery> => {
      const result = await client.request<ActionPlansWithFilterQuery>(GET_ALL_ACTION_PLANS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.actionPlans?.edges ?? []

  const actionPlansNodes: ActionPlansNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ActionPlansNodeNonNull)

  return { ...queryResult, actionPlansNodes }
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
  return useMutation<CreateBulkCsvActionPlanMutation, unknown, CreateBulkCsvActionPlanMutationVariables>({
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
