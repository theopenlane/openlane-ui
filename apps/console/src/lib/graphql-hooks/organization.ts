'use client'

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
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
  GET_ORGANIZATION_BILLING_BANNER,
  UPDATE_ORG_SETTING,
  TRANSFER_ORGANIZATION_OWNERSHIP,
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
  GetInvitesQueryVariables,
  GetOrganizationBillingBannerQuery,
  GetOrganizationBillingBannerQueryVariables,
  OrgMembershipWhereInput,
  UpdateOrganizationSettingMutationVariables,
  UpdateOrganizationSettingMutation,
  TransferOrganizationOwnershipMutationVariables,
  TransferOrganizationOwnershipMutation,
} from '@repo/codegen/src/schema'
import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'

export const useGetAllOrganizations = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllOrganizationsQuery>({
    queryKey: ['organizations'],
    queryFn: async () => client.request(GET_ALL_ORGANIZATIONS),
  })
}

export const useGetOrganizationNameById = (organizationId: string | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<GetOrganizationNameByIdQuery, GetOrganizationNameByIdQueryVariables>({
    queryKey: ['organizations', organizationId],
    queryFn: async () => client.request(GET_ORGANIZATION_NAME_BY_ID, { organizationId }),
    enabled: !!organizationId,
  })
}

export const useGetSingleOrganizationMembers = ({ organizationId, pagination }: { organizationId?: string; pagination?: TPagination }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSingleOrganizationMembersQuery, GetSingleOrganizationMembersQueryVariables>({
    queryKey: ['organizationsWithMembers', organizationId, pagination?.pageSize, pagination?.page],
    queryFn: async () => client.request(GET_SINGLE_ORGANIZATION_MEMBERS, { organizationId, ...pagination?.query }),
    enabled: !!organizationId,
  })
}

export const useGetAllOrganizationsWithMembers = (membersWhere: OrgMembershipWhereInput = {}) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllOrganizationsWithMembersQuery>({
    queryKey: ['organizationsWithMembers', membersWhere],
    queryFn: async () => client.request(GET_ALL_ORGANIZATIONS_WITH_MEMBERS, { membersWhere }),
  })
}

type useGetInvitesProp = {
  where: GetInvitesQueryVariables['where']
  orderBy?: GetInvitesQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useGetInvites = ({ where, orderBy, pagination, enabled = true }: useGetInvitesProp) => {
  const { client } = useGraphQLClient()

  return useQuery<GetInvitesQuery>({
    queryKey: ['invites', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: async () => client.request(GET_INVITES, { where, orderBy, ...pagination?.query }),
    enabled,
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

export const useGetBillingBanner = (organizationId: string | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<GetOrganizationBillingBannerQuery, GetOrganizationBillingBannerQueryVariables>({
    queryKey: ['organizationBilling', 'banner', organizationId],
    queryFn: async () => client.request(GET_ORGANIZATION_BILLING_BANNER, { organizationId }),
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

type CreateOrgExtensions = {
  auth?: {
    access_token: string
    refresh_token: string
    authorized_organization: string
  }
}

export const useCreateOrganization = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<{ data: CreateOrganizationMutation; extensions?: CreateOrgExtensions }, unknown, CreateOrganizationMutationVariables>({
    mutationFn: async (input) => {
      const response = await client.rawRequest<CreateOrganizationMutation, CreateOrganizationMutationVariables>(CREATE_ORGANIZATION, input)

      const typedExtensions = response.extensions as CreateOrgExtensions | undefined

      return {
        data: response.data,
        extensions: typedExtensions,
      }
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
    mutationFn: async (payload) => client.request(DELETE_ORGANIZATION_INVITE, payload),
  })
}

type DeleteOrgAuthExtensions = {
  auth: {
    access_token: string
    refresh_token: string
    authorized_organization: string
  }
}

export const useDeleteOrganization = () => {
  const { client } = useGraphQLClient()

  return useMutation<
    {
      data: DeleteOrganizationMutation
      extensions?: DeleteOrgAuthExtensions
    },
    unknown,
    DeleteOrganizationMutationVariables
  >({
    mutationFn: async (variables) => {
      const response = await client.rawRequest<DeleteOrganizationMutation, DeleteOrganizationMutationVariables>(DELETE_ORGANIZATION, variables)

      const typedExtensions = response.extensions as DeleteOrgAuthExtensions | undefined

      return {
        data: response.data,
        extensions: typedExtensions,
      }
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

export const useUpdateOrganizationSetting = () => {
  const { client } = useGraphQLClient()

  return useMutation({
    mutationFn: (payload: UpdateOrganizationSettingMutationVariables) => client.request<UpdateOrganizationSettingMutation>(UPDATE_ORG_SETTING, payload),
  })
}

export const useTransferOrganizationOwnership = () => {
  const { client } = useGraphQLClient()

  return useMutation({
    mutationFn: (payload: TransferOrganizationOwnershipMutationVariables) => client.request<TransferOrganizationOwnershipMutation>(TRANSFER_ORGANIZATION_OWNERSHIP, payload),
  })
}
