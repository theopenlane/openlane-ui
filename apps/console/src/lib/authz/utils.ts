import { TAccessRole } from '@/types/authz'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'

export const canCreate = (accessRole: TAccessRole[] | undefined, accessEnum: AccessEnum) => {
  return accessRole ? accessRole.includes(accessEnum) : false
}

export const canDelete = (accessRole: TAccessRole[] | undefined) => {
  return accessRole ? accessRole.includes(AccessEnum.CanDelete) : false
}

export const canView = (accessRole: TAccessRole[] | undefined) => {
  return accessRole ? accessRole.includes(AccessEnum.CanView) : false
}

export const canEdit = (accessRole: TAccessRole[] | undefined) => {
  return accessRole ? accessRole.includes(AccessEnum.CanEdit) : false
}
