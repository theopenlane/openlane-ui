import { type QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { type TPagination } from '@repo/ui/pagination-types'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useRefreshOnRelatedChange } from '@/lib/graphql-hooks/use-refresh-on-related-change'
import { invalidateCreateEdgeTargets, invalidateEdgeUpdateTargets } from '@/components/shared/object-association/object-association-config'
import {
  BULK_DELETE_CONTROL_IMPLEMENTATION,
  BULK_EDIT_CONTROL_IMPLEMENTATION,
  CONTROL_IMPLEMENTATION,
  CONTROL_IMPLEMENTATIONS_WITH_FILTER,
  CREATE_CONTROL_IMPLEMENTATION,
  DELETE_CONTROL_IMPLEMENTATION,
  GET_ALL_CONTROL_IMPLEMENTATIONS,
  GET_CONTROL_IMPLEMENTATION_ASSOCIATIONS,
  GET_CONTROL_IMPLEMENTATION_LINKED_CONTROLS,
  UPDATE_CONTROL_IMPLEMENTATION,
} from '@repo/codegen/query/control-implementation'
import {
  type ControlImplementationFieldsFragment,
  type ControlImplementationQuery,
  type ControlImplementationsWithFilterQuery,
  type ControlImplementationsWithFilterQueryVariables,
  type CreateControlImplementationInput,
  type CreateControlImplementationMutation,
  type DeleteBulkControlImplementationMutation,
  type DeleteBulkControlImplementationMutationVariables,
  type DeleteControlImplementationMutation,
  type DeleteControlImplementationMutationVariables,
  type GetAllControlImplementationsQuery,
  type GetAllControlImplementationsQueryVariables,
  type GetControlImplementationAssociationsQuery,
  type GetControlImplementationLinkedControlsQuery,
  type UpdateBulkControlImplementationMutation,
  type UpdateBulkControlImplementationMutationVariables,
  type UpdateControlImplementationInput,
  type UpdateControlImplementationMutation,
  type UpdateControlImplementationMutationVariables,
} from '@repo/codegen/src/schema'

const CONTROL_IMPLEMENTATIONS_KEY = 'controlImplementations'

export type ControlImplementationListNode = NonNullable<NonNullable<NonNullable<ControlImplementationsWithFilterQuery['controlImplementations']['edges']>[number]>['node']>

export type ControlImplementationDetailNode = NonNullable<ControlImplementationQuery['controlImplementation']>

export type ControlImplementationLinkedControls = NonNullable<GetControlImplementationLinkedControlsQuery['controlImplementation']>

const invalidateControlImplementationQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [CONTROL_IMPLEMENTATIONS_KEY] })
}

const invalidateParentControlQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['controls'] })
  queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
}

const invalidateAfterUpdate = (input: UpdateControlImplementationInput, queryClient: QueryClient) => {
  invalidateControlImplementationQueries(queryClient)
  invalidateEdgeUpdateTargets(input, queryClient)
  if (typeof input.verified === 'boolean') invalidateParentControlQueries(queryClient)
}

const invalidateAfterDelete = (queryClient: QueryClient, deletedId?: string) => {
  queryClient.invalidateQueries({ queryKey: [CONTROL_IMPLEMENTATIONS_KEY], predicate: ({ queryKey }) => !deletedId || queryKey[1] !== deletedId })
  invalidateParentControlQueries(queryClient)
}

const withVerificationDate = (input: UpdateControlImplementationInput): UpdateControlImplementationInput => (input.verified === false ? { ...input, clearVerificationDate: true } : input)

export const useGetAllControlImplementations = (where?: GetAllControlImplementationsQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllControlImplementationsQuery>({
    queryKey: ['controlImplementations', where],
    queryFn: () => client.request(GET_ALL_CONTROL_IMPLEMENTATIONS, { where }),
  })
}

export const useGetControlImplementationById = (id?: string | null) => {
  const { client } = useGraphQLClient()
  const result = useQuery<GetAllControlImplementationsQuery>({
    queryKey: ['controlImplementations', { id }],
    queryFn: () => client.request(GET_ALL_CONTROL_IMPLEMENTATIONS, { where: { id } }),
    enabled: !!id,
  })
  const node = result.data?.controlImplementations?.edges?.[0]?.node as ControlImplementationFieldsFragment | undefined
  return { ...result, data: node }
}

type ControlImplementationsWithFilterArgs = {
  where?: ControlImplementationsWithFilterQueryVariables['where']
  orderBy?: ControlImplementationsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
}

export const useControlImplementationsWithFilter = ({ where, orderBy, pagination }: ControlImplementationsWithFilterArgs) => {
  const { client } = useGraphQLClient()
  return useQuery<ControlImplementationsWithFilterQuery>({
    queryKey: [CONTROL_IMPLEMENTATIONS_KEY, 'table', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () => client.request(CONTROL_IMPLEMENTATIONS_WITH_FILTER, { where, orderBy, ...pagination?.query }),
  })
}

export const useControlImplementation = (controlImplementationId: string) => {
  const { client } = useGraphQLClient()
  return useQuery<ControlImplementationQuery>({
    queryKey: [CONTROL_IMPLEMENTATIONS_KEY, controlImplementationId],
    queryFn: () => client.request(CONTROL_IMPLEMENTATION, { controlImplementationId }),
    enabled: !!controlImplementationId,
    placeholderData: undefined,
  })
}

const RELATED_SECTIONS = { tasks: ['associations'], controls: ['linkedControls'], subcontrols: ['linkedControls'] }

export const useControlImplementationAssociations = (controlImplementationId: string) => {
  const { client } = useGraphQLClient()
  useRefreshOnRelatedChange(CONTROL_IMPLEMENTATIONS_KEY, controlImplementationId, RELATED_SECTIONS)
  return useQuery<GetControlImplementationAssociationsQuery>({
    queryKey: [CONTROL_IMPLEMENTATIONS_KEY, controlImplementationId, 'associations'],
    queryFn: () => client.request(GET_CONTROL_IMPLEMENTATION_ASSOCIATIONS, { controlImplementationId }),
    enabled: !!controlImplementationId,
    placeholderData: undefined,
  })
}

export const useControlImplementationLinkedControls = (controlImplementationId: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetControlImplementationLinkedControlsQuery>({
    queryKey: [CONTROL_IMPLEMENTATIONS_KEY, controlImplementationId, 'linkedControls'],
    queryFn: () => client.request(GET_CONTROL_IMPLEMENTATION_LINKED_CONTROLS, { controlImplementationId }),
    enabled: !!controlImplementationId,
    placeholderData: undefined,
  })
}

export const useCreateControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateControlImplementationMutation, Error, CreateControlImplementationInput>({
    mutationFn: (input) => client.request(CREATE_CONTROL_IMPLEMENTATION, { input }),
    onSuccess: (_, input) => {
      invalidateControlImplementationQueries(queryClient)
      invalidateCreateEdgeTargets(input, queryClient)
    },
  })
}

export const useUpdateControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlImplementationMutation, unknown, UpdateControlImplementationMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_CONTROL_IMPLEMENTATION, { ...variables, input: withVerificationDate(variables.input) }),
    onSuccess: (_, { input }) => {
      invalidateAfterUpdate(input, queryClient)
    },
  })
}

export const useDeleteControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteControlImplementationMutation, unknown, DeleteControlImplementationMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_CONTROL_IMPLEMENTATION, variables),
    onSuccess: (_, { deleteControlImplementationId }) => {
      invalidateAfterDelete(queryClient, deleteControlImplementationId)
    },
  })
}

export const useBulkEditControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkControlImplementationMutation, unknown, UpdateBulkControlImplementationMutationVariables>({
    mutationFn: (variables) => client.request(BULK_EDIT_CONTROL_IMPLEMENTATION, { ...variables, input: withVerificationDate(variables.input) }),
    onSuccess: (_, { input }) => {
      invalidateAfterUpdate(input, queryClient)
    },
  })
}

export const useBulkDeleteControlImplementation = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkControlImplementationMutation, unknown, DeleteBulkControlImplementationMutationVariables>({
    mutationFn: (variables) => client.request(BULK_DELETE_CONTROL_IMPLEMENTATION, variables),
    onSuccess: () => {
      invalidateAfterDelete(queryClient)
    },
  })
}
