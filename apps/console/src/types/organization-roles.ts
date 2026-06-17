export type OrganizationRole = {
  id: string
  name: string
  description: string
}

export type OrganizationRolesListReply = {
  success?: boolean
  roles: OrganizationRole[]
}

export type OrganizationRolesMutationReply = {
  success?: boolean
  organization_id?: string
  role?: string
}

export type OrganizationRoleSubjectType = 'user' | 'group'
