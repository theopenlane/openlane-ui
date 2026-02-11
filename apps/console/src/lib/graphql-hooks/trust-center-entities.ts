import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import { GET_ALL_TRUST_CENTERS_ENTITIES, CREATE_TRUST_CENTER_ENTITY, DELETE_TRUST_CENTER_ENTITY, UPDATE_TRUST_CENTER_ENTITY } from '@repo/codegen/query/trust-center-entities'
import {
  GetTrustCenterEntitiesQuery,
  GetTrustCenterEntitiesQueryVariables,
  CreateTrustCenterEntityMutation,
  CreateTrustCenterEntityMutationVariables,
  DeleteTrustCenterEntityMutation,
  DeleteTrustCenterEntityMutationVariables,
  UpdateTrustCenterEntityMutation,
  UpdateTrustCenterEntityMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export type TrustCenterEntityNode = NonNullable<NonNullable<NonNullable<GetTrustCenterEntitiesQuery['trustCenterEntities']>['edges']>[number]>['node']

export type TrustCenterEntityNodeNonNull = NonNullable<TrustCenterEntityNode>

type UseGetTrustCenterEntitiesArgs = {
  where?: GetTrustCenterEntitiesQueryVariables['where']
  enabled?: boolean
}

export const useGetTrustCenterEntities = ({ where, enabled = true }: UseGetTrustCenterEntitiesArgs = {}) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterEntitiesQuery, Error, GetTrustCenterEntitiesQuery>({
    queryKey: ['trustCenter', 'entities', where],
    queryFn: () => client.request<GetTrustCenterEntitiesQuery, GetTrustCenterEntitiesQueryVariables>(GET_ALL_TRUST_CENTERS_ENTITIES, { where }),
    enabled,
  })

  const edges = queryResult.data?.trustCenterEntities?.edges ?? []

  const entities: TrustCenterEntityNodeNonNull[] = edges
    .filter((edge): edge is NonNullable<(typeof edges)[number]> => edge != null)
    .map((edge) => edge.node)
    .filter((node): node is TrustCenterEntityNodeNonNull => node != null)

  return {
    ...queryResult,
    entities,
  }
}

type CreateTrustCenterEntityVars = CreateTrustCenterEntityMutationVariables & {
  logoFile?: File | null
}

export const useCreateTrustCenterEntity = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateTrustCenterEntityMutation, unknown, CreateTrustCenterEntityVars>({
    mutationFn: async (variables) => {
      const { input, logoFile } = variables

      if (logoFile) {
        return fetchGraphQLWithUpload({
          query: CREATE_TRUST_CENTER_ENTITY,
          variables: {
            input,
            logoFile,
          },
        }) as Promise<CreateTrustCenterEntityMutation>
      }

      return client.request<CreateTrustCenterEntityMutation, CreateTrustCenterEntityMutationVariables>(CREATE_TRUST_CENTER_ENTITY, { input })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'entities'] })
    },
  })
}

export const useDeleteTrustCenterEntity = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteTrustCenterEntityMutation, Error, DeleteTrustCenterEntityMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteTrustCenterEntityMutation, DeleteTrustCenterEntityMutationVariables>(DELETE_TRUST_CENTER_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'entities'],
      })
    },
  })
}

export const useUpdateTrustCenterEntity = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterEntityMutation, Error, UpdateTrustCenterEntityMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: UPDATE_TRUST_CENTER_ENTITY,
        variables,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'entities'],
      })
    },
  })
}
