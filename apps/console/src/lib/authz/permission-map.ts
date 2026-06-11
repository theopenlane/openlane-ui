import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

export type CrudOp = 'create' | 'edit' | 'delete' | 'view'

const ACCESS_VALUES = new Set<string>(Object.values(AccessEnum))

export const deriveOrgMember = (objectType: ObjectTypes, op: CrudOp): AccessEnum | undefined => {
  const candidate = `can_${op}_${objectToSnakeCase(objectType)}`
  return ACCESS_VALUES.has(candidate) ? (candidate as AccessEnum) : undefined
}

export const IRREGULAR_PERMISSIONS = {
  cloneControl: AccessEnum.CanCreateControl,
  manageGroup: AccessEnum.CanManageGroup,
  manageCampaigns: AccessEnum.CanManageCampaigns,
  manageCompliance: AccessEnum.CanManageCompliance,
  managePolicies: AccessEnum.CanManagePolicies,
  manageRegistry: AccessEnum.CanManageRegistry,
  manageRisk: AccessEnum.CanManageRisk,
  manageTrustCenter: AccessEnum.CanManageTrustCenter,
  manageWorkflows: AccessEnum.CanManageWorkflows,
  inviteAdmins: AccessEnum.CanInviteAdmins,
  inviteMembers: AccessEnum.CanInviteMembers,
  inviteAuditors: AccessEnum.CanInviteAuditors,
  inviteSuperAdmins: AccessEnum.CanInviteSuperAdmins,
  auditLogViewer: AccessEnum.AuditLogViewer,
} as const

export type IrregularAction = keyof typeof IRREGULAR_PERMISSIONS
