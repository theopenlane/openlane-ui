'use client'

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { getGraphQLClient } from '@/lib/graphqlClient'
import {
  GET_ALL_ORGANIZATIONS,
  GET_ORGANIZATION_NAME_BY_ID,
  GET_SINGLE_ORGANIZATION_MEMBERS,
  GET_ALL_ORGANIZATIONS_WITH_MEMBERS,
  GET_INVITES,
  GET_ORGANIZATION_BILLING,
  GET_ORGANIZATION_SETTING,
  GET_BILLING_EMAIL,
  CREATE_ORGANIZATION,
  CREATE_BULK_INVITE,
  DELETE_ORGANIZATION_INVITE,
  DELETE_ORGANIZATION,
  UPDATE_ORGANIZATION,
} from '@repo/codegen/query/organization'
import {
  GetAllOrganizationsQuery,
  GetSingleOrganizationMembersQuery,
  GetSingleOrganizationMembersQueryVariables,
  GetAllOrganizationsWithMembersQuery,
  GetInvitesQuery,
  GetOrganizationBillingQuery,
  GetOrganizationBillingQueryVariables,
  GetOrganizationSettingQuery,
  GetOrganizationSettingQueryVariables,
  GetBillingEmailQuery,
  GetBillingEmailQueryVariables,
  CreateOrganizationMutation,
  CreateOrganizationMutationVariables,
  UpdateOrganizationMutation,
  UpdateOrganizationMutationVariables,
  CreateBulkInviteMutation,
  CreateBulkInviteMutationVariables,
  DeleteOrganizationInviteMutation,
  DeleteOrganizationInviteMutationVariables,
  DeleteOrganizationMutation,
  DeleteOrganizationMutationVariables,
  GetOrganizationNameByIdQuery,
  GetOrganizationNameByIdQueryVariables,
} from '@repo/codegen/src/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import { RequestDocument, Variables } from 'graphql-request'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export const useGetAllOrganizations = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllOrganizationsQuery>({
    queryKey: ['organizations'],
    queryFn: async () => client.request(GET_ALL_ORGANIZATIONS),
  })
}

export const useGetOrganizationNameById = (organizationId: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetOrganizationNameByIdQuery, GetOrganizationNameByIdQueryVariables>({
    queryKey: ['organization', organizationId],
    queryFn: async () => client.request(GET_ORGANIZATION_NAME_BY_ID, { organizationId }),
    enabled: !!organizationId,
  })
}

export const useGetSingleOrganizationMembers = (organizationId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSingleOrganizationMembersQuery, GetSingleOrganizationMembersQueryVariables>({
    queryKey: ['organizationsWithMembers', organizationId],
    queryFn: async () => client.request(GET_SINGLE_ORGANIZATION_MEMBERS, { organizationId }),
    enabled: !!organizationId,
  })
}

export const useGetAllOrganizationsWithMembers = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllOrganizationsWithMembersQuery>({
    queryKey: ['organizationsWithMembers'],
    queryFn: async () => client.request(GET_ALL_ORGANIZATIONS_WITH_MEMBERS),
  })
}

export const useGetInvites = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetInvitesQuery>({
    queryKey: ['invites'],
    queryFn: async () => client.request(GET_INVITES),
  })
}

export const useGetOrganizationBilling = (organizationId: string | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<GetOrganizationBillingQuery, GetOrganizationBillingQueryVariables>({
    queryKey: ['organizationBilling', organizationId],
    queryFn: async () => client.request(GET_ORGANIZATION_BILLING, { organizationId }),
    enabled: !!organizationId,
  })
}

export const useGetOrganizationSetting = (organizationId: string | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<GetOrganizationSettingQuery, GetOrganizationSettingQueryVariables>({
    queryKey: ['organizationSetting', organizationId],
    queryFn: async () => client.request(GET_ORGANIZATION_SETTING, { organizationId }),
    enabled: !!organizationId,
  })
}

export const useGetBillingEmail = (organizationId: string | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<GetBillingEmailQuery, GetBillingEmailQueryVariables>({
    queryKey: ['billingEmail', organizationId],
    queryFn: async () => client.request(GET_BILLING_EMAIL, { organizationId }),
    enabled: !!organizationId,
  })
}

export const useCreateOrganization = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<{ data: CreateOrganizationMutation; extensions?: Record<string, any> }, unknown, CreateOrganizationMutationVariables>({
    mutationFn: async (input) => {
      const response: any = await client.rawRequest(CREATE_ORGANIZATION, input)
      return { data: response.data, extensions: response.extensions ?? {} }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationsWithMembers'] })
    },
  })
}

export const useUpdateOrganization = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateOrganizationMutation, unknown, UpdateOrganizationMutationVariables>({
    mutationFn: async (payload) => client.request(UPDATE_ORGANIZATION, payload),
  })
}

export const useCreateBulkInvite = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateBulkInviteMutation, unknown, CreateBulkInviteMutationVariables>({
    mutationFn: async (payload) => client.request(CREATE_BULK_INVITE, payload),
  })
}

export const useDeleteOrganizationInvite = () => {
  const { client } = useGraphQLClient()

  return useMutation<DeleteOrganizationInviteMutation, unknown, DeleteOrganizationInviteMutationVariables>({
    mutationFn: async (deleteInviteId) => client.request(DELETE_ORGANIZATION_INVITE, { deleteInviteId }),
  })
}

export const useDeleteOrganization = () => {
  const { client } = useGraphQLClient()

  return useMutation<{ data: DeleteOrganizationMutation; extensions?: Record<string, any> }, unknown, DeleteOrganizationMutationVariables>({
    mutationFn: async (variables) => {
      const response = await client.rawRequest<DeleteOrganizationMutation, Variables>(DELETE_ORGANIZATION as string, variables)
      return { data: response.data, extensions: response.extensions as Record<string, any> | undefined }
    },
  })
}

export const useUpdateOrgAvatar = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: (payload: UpdateOrganizationMutationVariables) => fetchGraphQLWithUpload({ query: UPDATE_ORGANIZATION, variables: payload }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
