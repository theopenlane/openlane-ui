import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

export type CrudOp = 'create' | 'edit' | 'delete' | 'view'

// The set of every relation the backend FGA model defines, used to reject derived members that
// don't actually exist (not every ObjectTypes has a generated can_<op>_<object> relation).
const ACCESS_VALUES = new Set<string>(Object.values(AccessEnum))

// deriveOrgMember maps an object type + CRUD op to its org-qualified AccessEnum member, e.g.
// (Control, 'create') -> CanCreateControl. The backend relation is can_<op>_<snake(object)> and
// ObjectTypes values are the PascalCase entity names, so objectToSnakeCase reproduces it exactly.
// Returns undefined when no such relation exists, so callers degrade to "no special gate".
export const deriveOrgMember = (objectType: ObjectTypes, op: CrudOp): AccessEnum | undefined => {
  const candidate = `can_${op}_${objectToSnakeCase(objectType)}`
  return ACCESS_VALUES.has(candidate) ? (candidate as AccessEnum) : undefined
}

// Non-CRUD / aggregate actions whose permission can't be derived from the can_<op>_<object>
// convention. This is the ONLY hand-maintained part of the action->permission mapping; the
// permission-coverage test asserts every value here is a real AccessEnum member. Keep it small —
// anything that fits the CRUD convention belongs in deriveOrgMember, not here.
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
