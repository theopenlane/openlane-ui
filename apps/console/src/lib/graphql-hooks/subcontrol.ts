import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_SUBCONTROL, DELETE_SUBCONTROL, GET_ALL_SUBCONTROLS, GET_SUBCONTROL_BY_ID, GET_SUBCONTROL_SELECT_OPTIONS, UPDATE_SUBCONTROL } from '@repo/codegen/query/subcontrol'
import {
  CreateSubcontrolMutation,
  CreateSubcontrolMutationVariables,
  DeleteSubcontrolMutation,
  DeleteSubcontrolMutationVariables,
  GetAllSubcontrolsQuery,
  GetAllSubcontrolsQueryVariables,
  GetSubcontrolByIdQuery,
  GetSubcontrolSelectOptionsQuery,
  GetSubcontrolSelectOptionsQueryVariables,
  SubcontrolWhereInput,
  UpdateSubcontrolMutation,
  UpdateSubcontrolMutationVariables,
} from '@repo/codegen/src/schema'
import { useMemo } from 'react'

export function useGetAllSubcontrols(where?: GetAllSubcontrolsQueryVariables['where']) {
  const { client } = useGraphQLClient()

  return useQuery<GetAllSubcontrolsQuery, unknown>({
    queryKey: ['subcontrols', where],
    queryFn: async () =>
      client.request<GetAllSubcontrolsQuery, GetAllSubcontrolsQueryVariables>(GET_ALL_SUBCONTROLS, {
        where,
      }),
  })
}

export const useGetSubcontrolById = (subcontrolId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolByIdQuery, unknown>({
    queryKey: ['subcontrols', subcontrolId],
    queryFn: async () => client.request(GET_SUBCONTROL_BY_ID, { subcontrolId }),
    enabled: !!subcontrolId,
  })
}

export const useUpdateSubcontrol = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateSubcontrolMutation, unknown, UpdateSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SUBCONTROL, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subcontrols'] }),
  })
}

export const useDeleteSubcontrol = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteSubcontrolMutation, unknown, DeleteSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
    },
  })
}

export const useCreateSubcontrol = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateSubcontrolMutation, unknown, CreateSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
    },
  })
}

export const useSubcontrolSelect = ({ where, enabled = true }: { where?: SubcontrolWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const { data, isLoading, error } = useQuery<GetSubcontrolSelectOptionsQuery>({
    queryKey: ['subcontrols', where, 'select'],
    queryFn: async () => {
      return client.request<GetSubcontrolSelectOptionsQuery, GetSubcontrolSelectOptionsQueryVariables>(GET_SUBCONTROL_SELECT_OPTIONS, { where })
    },
    enabled,
  })

  const subcontrolOptions = useMemo(
    () =>
      data?.subcontrols?.edges?.flatMap((edge) =>
        edge?.node?.id && edge.node.refCode ? [{ label: `${edge.node.refCode}${edge.node.referenceFramework ? `( ${edge.node.referenceFramework})` : ''}`, value: edge.node.id }] : [],
      ) ?? [],
    [data],
  )

  return {
    subcontrolOptions,
    isLoading,
    error,
    data,
  }
}
