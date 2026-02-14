import { ObjectTypes } from '@repo/codegen/src/type-names'

const objectTypeKeys = Object.keys(ObjectTypes).reduce(
  (acc, key) => {
    const val = (ObjectTypes as any)[key] as string // e.g. 'Asset'
    acc[key] = toKebab(val)
    return acc
  },
  {} as Record<string, string>,
)

export function toKebab(name: string): string {
  if (!name) return ''
  if (name.includes('-')) return name.toLowerCase()
  if (name === name.toUpperCase() || name.includes('_')) return name.replace(/_/g, '-').toLowerCase()
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

// Additional enums that are not directly related to object types but are used for specific tables in the application
export enum AdditionalTableKeyEnum {
  PROGRAM_ASSIGN_USER = 'program-assign-user',
  PROGRAM_SETTINGS_GROUP = 'program-settings-group',
  PROGRAM_SETTINGS_IMPORT_CONTROLS = 'program-settings-import-controls',
  PROGRAM_SETTINGS_IMPORT_CONTROLS_PROGRAM = 'program-settings-import-controls-program',
  PROGRAM_SETTINGS_USERS = 'program-settings-users',
  STANDARD_DETAILS_ACCORDION = 'standard-details-accordion',
  STANDARD_CATALOG = 'standard-catalog',
  QUESTIONNAIRE_OVERVIEW = 'questionnaire-overview',
  OVERVIEW_RISK = 'overview-risk',
  ORG_INVITE = 'org-invite',
  MEMBER = 'member',
  QUESTIONNAIRE = 'questionnaire',
  DOCUMENTS = 'documents',
  GROUP_ASSIGN_PERMISSION = 'group-assign-permission',
  GROUP_SELECTED_PERMISSION = 'group-selected-permission',
  GROUP_INHERIT_PERMISSION = 'group-inherit-permission',
  GROUP_DELETE_PERMISSION = 'group-delete-permission',
  GROUP_PROGRAM_SETTINGS = 'group-program-settings',
  GROUP_MEMBERS = 'group-members',
  GROUP_PERMISSION = 'group-permission',
  PERSONAL_ACCESS_TOKEN = 'personal-access-token',
  CONTROLS_MAPPED_CATEGORIES = 'controls-mapped-categories',
  EVIDENCE_FILES = 'evidence-files',
  EVIDENCE_EXISTING_FILES = 'evidence-existing-files',
  POLICY_PROCEDURE_MANAGE_PERMISSION = 'policy-procedure-manage-permission',
  POLICY_PROCEDURE_ASSIGN_PERMISSION = 'policy-procedure-assign-permission',
  POLICY_WITHOUT_PROCEDURE = 'policy-without-procedure',
  POLICY_AWAITING_APPROVAL = 'policy-awaiting-approval',
  POLICIES_REVIEW_DUE_SOON = 'policies-review-due',
  OVERVIEW_PENDING_ACTIONS = 'overview-pending-actions',
  OVERVIEW_WAITING_APPROVAL = 'overview-waiting-approval',
  MEMBERS_INVITE_SHEET = 'members-invite-sheet',
  OBJECT_ASSOCIATION = 'object-association',
  OBJECT_ASSOCIATION_PROGRAMS = 'object-association-programs',
  OBJECT_ASSOCIATION_CONTROLS = 'object-association-controls',
  TRUST_CENTER_DOCUMENT_FILES = 'trust-center-document-files',
  TRUST_CENTER_REPORTS_AND_CERTS = 'trust-center-reports-and-certs',
  TRUST_CENTER_NDA_REQUESTS = 'trust-center-nda-requests',
  TABLE_STORIES = 'table-stories',
  TRUST_CENTER_SUBPROCESSORS = 'subprocessors',
  CUSTOM_TAGS = 'custom-tags',
  CUSTOM_ENUMS = 'custom-enums',
  CONTROL_DOC_PROCEDURES = 'control-doc-procedures',
  CONTROL_DOC_POLICIES = 'control-doc-policies',
  CONTROL_DOC_TASKS = 'control-doc-tasks',
  CONTROL_DOC_PROGRAMS = 'control-doc-programs',
  CONTROL_DOC_RISKS = 'control-doc-risks',
  CONTROL_ACTIVITY_TASKS = 'control-activity-tasks',
  VENDOR = 'vendor',
}

export const TableKey = Object.freeze({
  ...(objectTypeKeys as unknown as { [K in keyof typeof ObjectTypes]: string }),
  ...AdditionalTableKeyEnum,
}) as { readonly [K in keyof typeof ObjectTypes]: string } & typeof AdditionalTableKeyEnum

export const TableKeyEnum = TableKey

// Value type for keys
export type TableKeyValue = (typeof TableKeyEnum)[keyof typeof TableKeyEnum]
