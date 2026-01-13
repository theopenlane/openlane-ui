import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import { GET_TRUST_CENTER_ENTITIES, CREATE_TRUST_CENTER_ENTITY, DELETE_TRUST_CENTER_ENTITY, UPDATE_TRUST_CENTER_ENTITY } from '@repo/codegen/query/trust-center-entities'
import {
  GetTrustCenterEntitiesQuery,
  GetTrustCenterEntitiesQueryVariables,
  CreateTrustcenterEntityMutation,
  CreateTrustcenterEntityMutationVariables,
  DeleteTrustcenterEntityMutation,
  DeleteTrustcenterEntityMutationVariables,
  UpdateTrustcenterEntityMutation,
  UpdateTrustcenterEntityMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export type TrustcenterEntityNode = NonNullable<NonNullable<NonNullable<GetTrustCenterEntitiesQuery['trustcenterEntities']>['edges']>[number]>['node']

export type TrustcenterEntityNodeNonNull = NonNullable<TrustcenterEntityNode>

type UseGetTrustCenterEntitiesArgs = {
  where?: GetTrustCenterEntitiesQueryVariables['where']
  enabled?: boolean
}

export const useGetTrustCenterEntities = ({ where, enabled = true }: UseGetTrustCenterEntitiesArgs = {}) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterEntitiesQuery, Error, GetTrustCenterEntitiesQuery>({
    queryKey: ['trustCenter', 'entities', where],
    queryFn: () => client.request<GetTrustCenterEntitiesQuery, GetTrustCenterEntitiesQueryVariables>(GET_TRUST_CENTER_ENTITIES, { where }),
    enabled,
  })

  const edges = queryResult.data?.trustcenterEntities?.edges ?? []

  const entities: TrustcenterEntityNodeNonNull[] = edges
    .filter((edge): edge is NonNullable<(typeof edges)[number]> => edge != null)
    .map((edge) => edge.node)
    .filter((node): node is TrustcenterEntityNodeNonNull => node != null)

  return {
    ...queryResult,
    entities,
  }
}

type CreateTrustCenterEntityVars = CreateTrustcenterEntityMutationVariables & {
  logoFile?: File | null
}

export const useCreateTrustCenterEntity = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateTrustcenterEntityMutation, unknown, CreateTrustCenterEntityVars>({
    mutationFn: async (variables) => {
      const { input, logoFile } = variables

      if (logoFile) {
        return fetchGraphQLWithUpload({
          query: CREATE_TRUST_CENTER_ENTITY,
          variables: {
            input,
            logoFile,
          },
        }) as Promise<CreateTrustcenterEntityMutation>
      }

      return client.request<CreateTrustcenterEntityMutation, CreateTrustcenterEntityMutationVariables>(CREATE_TRUST_CENTER_ENTITY, { input })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'entities'] })
    },
  })
}

export const useDeleteTrustCenterEntity = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteTrustcenterEntityMutation, Error, DeleteTrustcenterEntityMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteTrustcenterEntityMutation, DeleteTrustcenterEntityMutationVariables>(DELETE_TRUST_CENTER_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'entities'],
      })
    },
  })
}

export const useUpdateTrustCenterEntity = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustcenterEntityMutation, Error, UpdateTrustcenterEntityMutationVariables>({
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
