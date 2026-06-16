export type OrganizationRole = {
  id: string
  name: string
  description: string
}

export type OrganizationRolesListReply = {
  success?: boolean
  roles: OrganizationRole[]
}

export type AssignOrganizationRolesInput = {
  role: string
  user_ids?: string[]
  group_ids?: string[]
  organization_id?: string
}

export type OrganizationRolesMutationReply = {
  success?: boolean
  organization_id?: string
  role?: string
}

export type OrganizationRoleSubjectType = 'user' | 'group'
