import { TAccessRole } from '@/lib/authz/access-api.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'

export const canCreate = (accessRole: TAccessRole[], accessEnum: AccessEnum) => {
  return accessRole ? accessRole.includes(accessEnum) : false
}

export const canDelete = (accessRole: TAccessRole[]) => {
  return accessRole ? accessRole.includes(AccessEnum.CanDelete) : false
}

export const canView = (accessRole: TAccessRole[]) => {
  return accessRole ? accessRole.includes(AccessEnum.CanView) : false
}

export const canEdit = (accessRole: TAccessRole[]) => {
  return accessRole ? accessRole.includes(AccessEnum.CanEdit) : false
}
