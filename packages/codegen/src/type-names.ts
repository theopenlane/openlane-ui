// This file is auto-generated. Do not edit manually.

import {
  ActionPlan,
  Assessment,
  Asset,
  Campaign,
  Control,
  ControlImplementation,
  ControlObjective,
  EmailBranding,
  Entity,
  Evidence,
  Finding,
  Group,
  IdentityHolder,
  InternalPolicy,
  MappedControl,
  Narrative,
  PageInfo,
  Platform,
  Procedure,
  Program,
  Remediation,
  Review,
  Risk,
  Scan,
  Subcontrol,
  TrustCenter,
  TrustCenterCompliance,
  TrustCenterDoc,
  TrustCenterEntity,
  TrustCenterNdaRequest,
  TrustCenterSetting,
  TrustCenterSubprocessor,
  TrustCenterWatermarkConfig,
  Vulnerability,
} from './schema'
import { GET_ALL_ASSESSMENTS } from '@repo/codegen/query/assessment'
import { GET_ALL_ASSETS } from '@repo/codegen/query/asset'
import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_IMPLEMENTATIONS } from '@repo/codegen/query/control-implementation'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_MAPPED_CONTROLS } from '@repo/codegen/query/mapped-control'
import { GET_ALL_NARRATIVES } from '@repo/codegen/query/narrative'
import { GET_ALL_PROCEDURES } from '@repo/codegen/query/procedure'
import { GET_ALL_TRUST_CENTERS } from '@repo/codegen/query/trust-center'
import { GET_ALL_EVIDENCES } from '@repo/codegen/query/evidence'
import { GET_ALL_GROUPS } from '@repo/codegen/query/group'
import { GET_ALL_SUBCONTROLS } from '@repo/codegen/query/subcontrol'

export enum ObjectTypes {
  API_TOKEN = 'ApiToken',
  ACTION_PLAN = 'ActionPlan',
  ASSESSMENT = 'Assessment',
  ASSESSMENT_RESPONSE = 'AssessmentResponse',
  ASSET = 'Asset',
  CAMPAIGN = 'Campaign',
  CAMPAIGN_TARGET = 'CampaignTarget',
  CONTACT = 'Contact',
  CONTROL = 'Control',
  CONTROL_IMPLEMENTATION = 'ControlImplementation',
  CONTROL_OBJECTIVE = 'ControlObjective',
  CUSTOM_DOMAIN = 'CustomDomain',
  CUSTOM_TYPE_ENUM = 'CustomTypeEnum',
  DNS_VERIFICATION = 'DnsVerification',
  DIRECTORY_ACCOUNT = 'DirectoryAccount',
  DIRECTORY_GROUP = 'DirectoryGroup',
  DIRECTORY_MEMBERSHIP = 'DirectoryMembership',
  DIRECTORY_SYNC_RUN = 'DirectorySyncRun',
  DISCUSSION = 'Discussion',
  DOCUMENT_DATA = 'DocumentData',
  EMAIL_BRANDING = 'EmailBranding',
  EMAIL_TEMPLATE = 'EmailTemplate',
  ENTITY = 'Entity',
  ENTITY_TYPE = 'EntityType',
  EVENT = 'Event',
  EVIDENCE = 'Evidence',
  EXPORT = 'Export',
  FILE = 'File',
  FINDING = 'Finding',
  FINDING_CONTROL = 'FindingControl',
  GROUP = 'Group',
  GROUP_MEMBERSHIP = 'GroupMembership',
  GROUP_PERMISSION = 'GroupPermission',
  GROUP_SETTING = 'GroupSetting',
  HUSH = 'Hush',
  IDENTITY_HOLDER = 'IdentityHolder',
  INTEGRATION = 'Integration',
  INTERNAL_POLICY = 'InternalPolicy',
  INVITE = 'Invite',
  JOB_RESULT = 'JobResult',
  JOB_RUNNER = 'JobRunner',
  JOB_RUNNER_REGISTRATION_TOKEN = 'JobRunnerRegistrationToken',
  JOB_RUNNER_TOKEN = 'JobRunnerToken',
  JOB_TEMPLATE = 'JobTemplate',
  MAPPABLE_DOMAIN = 'MappableDomain',
  MAPPED_CONTROL = 'MappedControl',
  NARRATIVE = 'Narrative',
  NOTE = 'Note',
  NOTIFICATION = 'Notification',
  NOTIFICATION_PREFERENCE = 'NotificationPreference',
  NOTIFICATION_TEMPLATE = 'NotificationTemplate',
  ONBOARDING = 'Onboarding',
  ORG_MEMBERSHIP = 'OrgMembership',
  ORG_SUBSCRIPTION = 'OrgSubscription',
  ORGANIZATION = 'Organization',
  ORGANIZATION_SETTING = 'OrganizationSetting',
  PERSONAL_ACCESS_TOKEN = 'PersonalAccessToken',
  PLATFORM = 'Platform',
  PROCEDURE = 'Procedure',
  PROGRAM = 'Program',
  PROGRAM_MEMBERSHIP = 'ProgramMembership',
  REMEDIATION = 'Remediation',
  REVIEW = 'Review',
  RISK = 'Risk',
  SCAN = 'Scan',
  SCHEDULED_JOB = 'ScheduledJob',
  SCHEDULED_JOB_RUN = 'ScheduledJobRun',
  STANDARD = 'Standard',
  SUBCONTROL = 'Subcontrol',
  SUBPROCESSOR = 'Subprocessor',
  SUBSCRIBER = 'Subscriber',
  TFA_SETTING = 'TfaSetting',
  TAG_DEFINITION = 'TagDefinition',
  TASK = 'Task',
  TEMPLATE = 'Template',
  TRUST_CENTER = 'TrustCenter',
  TRUST_CENTER_COMPLIANCE = 'TrustCenterCompliance',
  TRUST_CENTER_DOC = 'TrustCenterDoc',
  TRUST_CENTER_ENTITY = 'TrustCenterEntity',
  TRUST_CENTER_NDA_REQUEST = 'TrustCenterNdaRequest',
  TRUST_CENTER_SETTING = 'TrustCenterSetting',
  TRUST_CENTER_SUBPROCESSOR = 'TrustCenterSubprocessor',
  TRUST_CENTER_WATERMARK_CONFIG = 'TrustCenterWatermarkConfig',
  USER = 'User',
  USER_SETTING = 'UserSetting',
  VULNERABILITY = 'Vulnerability',
  WEBAUTHN = 'Webauthn',
  WORKFLOW_ASSIGNMENT = 'WorkflowAssignment',
  WORKFLOW_ASSIGNMENT_TARGET = 'WorkflowAssignmentTarget',
  WORKFLOW_DEFINITION = 'WorkflowDefinition',
  WORKFLOW_EVENT = 'WorkflowEvent',
  WORKFLOW_INSTANCE = 'WorkflowInstance',
  WORKFLOW_OBJECT_REF = 'WorkflowObjectRef',
  WORKFLOW_PROPOSAL = 'WorkflowProposal',
}

export enum ObjectNames {
  API_TOKEN = 'Api Token',
  ACTION_PLAN = 'Action Plan',
  ASSESSMENT = 'Assessment',
  ASSESSMENT_RESPONSE = 'Assessment Response',
  ASSET = 'Asset',
  CAMPAIGN = 'Campaign',
  CAMPAIGN_TARGET = 'Campaign Target',
  CONTACT = 'Contact',
  CONTROL = 'Control',
  CONTROL_IMPLEMENTATION = 'Control Implementation',
  CONTROL_OBJECTIVE = 'Control Objective',
  CUSTOM_DOMAIN = 'Custom Domain',
  CUSTOM_TYPE_ENUM = 'Custom Type Enum',
  DNS_VERIFICATION = 'Dns Verification',
  DIRECTORY_ACCOUNT = 'Directory Account',
  DIRECTORY_GROUP = 'Directory Group',
  DIRECTORY_MEMBERSHIP = 'Directory Membership',
  DIRECTORY_SYNC_RUN = 'Directory Sync Run',
  DISCUSSION = 'Discussion',
  DOCUMENT_DATA = 'Document Data',
  EMAIL_BRANDING = 'Email Branding',
  EMAIL_TEMPLATE = 'Email Template',
  ENTITY = 'Entity',
  ENTITY_TYPE = 'Entity Type',
  EVENT = 'Event',
  EVIDENCE = 'Evidence',
  EXPORT = 'Export',
  FILE = 'File',
  FINDING = 'Finding',
  FINDING_CONTROL = 'Finding Control',
  GROUP = 'Group',
  GROUP_MEMBERSHIP = 'Group Membership',
  GROUP_PERMISSION = 'Group Permission',
  GROUP_SETTING = 'Group Setting',
  HUSH = 'Hush',
  IDENTITY_HOLDER = 'Identity Holder',
  INTEGRATION = 'Integration',
  INTERNAL_POLICY = 'Internal Policy',
  INVITE = 'Invite',
  JOB_RESULT = 'Job Result',
  JOB_RUNNER = 'Job Runner',
  JOB_RUNNER_REGISTRATION_TOKEN = 'Job Runner Registration Token',
  JOB_RUNNER_TOKEN = 'Job Runner Token',
  JOB_TEMPLATE = 'Job Template',
  MAPPABLE_DOMAIN = 'Mappable Domain',
  MAPPED_CONTROL = 'Mapped Control',
  NARRATIVE = 'Narrative',
  NOTE = 'Note',
  NOTIFICATION = 'Notification',
  NOTIFICATION_PREFERENCE = 'Notification Preference',
  NOTIFICATION_TEMPLATE = 'Notification Template',
  ONBOARDING = 'Onboarding',
  ORG_MEMBERSHIP = 'Org Membership',
  ORG_SUBSCRIPTION = 'Org Subscription',
  ORGANIZATION = 'Organization',
  ORGANIZATION_SETTING = 'Organization Setting',
  PERSONAL_ACCESS_TOKEN = 'Personal Access Token',
  PLATFORM = 'Platform',
  PROCEDURE = 'Procedure',
  PROGRAM = 'Program',
  PROGRAM_MEMBERSHIP = 'Program Membership',
  REMEDIATION = 'Remediation',
  REVIEW = 'Review',
  RISK = 'Risk',
  SCAN = 'Scan',
  SCHEDULED_JOB = 'Scheduled Job',
  SCHEDULED_JOB_RUN = 'Scheduled Job Run',
  STANDARD = 'Standard',
  SUBCONTROL = 'Subcontrol',
  SUBPROCESSOR = 'Subprocessor',
  SUBSCRIBER = 'Subscriber',
  TFA_SETTING = 'Tfa Setting',
  TAG_DEFINITION = 'Tag Definition',
  TASK = 'Task',
  TEMPLATE = 'Template',
  TRUST_CENTER = 'Trust Center',
  TRUST_CENTER_COMPLIANCE = 'Trust Center Compliance',
  TRUST_CENTER_DOC = 'Trust Center Doc',
  TRUST_CENTER_ENTITY = 'Trust Center Entity',
  TRUST_CENTER_NDA_REQUEST = 'Trust Center Nda Request',
  TRUST_CENTER_SETTING = 'Trust Center Setting',
  TRUST_CENTER_SUBPROCESSOR = 'Trust Center Subprocessor',
  TRUST_CENTER_WATERMARK_CONFIG = 'Trust Center Watermark Config',
  USER = 'User',
  USER_SETTING = 'User Setting',
  VULNERABILITY = 'Vulnerability',
  WEBAUTHN = 'Webauthn',
  WORKFLOW_ASSIGNMENT = 'Workflow Assignment',
  WORKFLOW_ASSIGNMENT_TARGET = 'Workflow Assignment Target',
  WORKFLOW_DEFINITION = 'Workflow Definition',
  WORKFLOW_EVENT = 'Workflow Event',
  WORKFLOW_INSTANCE = 'Workflow Instance',
  WORKFLOW_OBJECT_REF = 'Workflow Object Ref',
  WORKFLOW_PROPOSAL = 'Workflow Proposal',
}

export enum TypesWithPermissions {
  ACTION_PLAN = 'ActionPlan',
  ASSESSMENT = 'Assessment',
  ASSET = 'Asset',
  CAMPAIGN = 'Campaign',
  CONTROL = 'Control',
  CONTROL_IMPLEMENTATION = 'ControlImplementation',
  CONTROL_OBJECTIVE = 'ControlObjective',
  EMAIL_BRANDING = 'EmailBranding',
  ENTITY = 'Entity',
  FINDING = 'Finding',
  IDENTITY_HOLDER = 'IdentityHolder',
  INTERNAL_POLICY = 'InternalPolicy',
  MAPPED_CONTROL = 'MappedControl',
  NARRATIVE = 'Narrative',
  PLATFORM = 'Platform',
  PROCEDURE = 'Procedure',
  PROGRAM = 'Program',
  REMEDIATION = 'Remediation',
  REVIEW = 'Review',
  RISK = 'Risk',
  SCAN = 'Scan',
  TRUST_CENTER = 'TrustCenter',
  TRUST_CENTER_COMPLIANCE = 'TrustCenterCompliance',
  TRUST_CENTER_DOC = 'TrustCenterDoc',
  TRUST_CENTER_ENTITY = 'TrustCenterEntity',
  TRUST_CENTER_NDA_REQUEST = 'TrustCenterNdaRequest',
  TRUST_CENTER_SETTING = 'TrustCenterSetting',
  TRUST_CENTER_SUBPROCESSOR = 'TrustCenterSubprocessor',
  TRUST_CENTER_WATERMARK_CONFIG = 'TrustCenterWatermarkConfig',
  VULNERABILITY = 'Vulnerability',
}

export type PermissionsAllQueriesData = {
  actionPlans?: {
    edges?: Array<{ node: ActionPlan }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  assessments?: {
    edges?: Array<{ node: Assessment }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  assets?: {
    edges?: Array<{ node: Asset }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  campaigns?: {
    edges?: Array<{ node: Campaign }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controls?: {
    edges?: Array<{ node: Control }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controlImplementations?: {
    edges?: Array<{ node: ControlImplementation }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controlObjectives?: {
    edges?: Array<{ node: ControlObjective }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  emailBrandings?: {
    edges?: Array<{ node: EmailBranding }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  entities?: {
    edges?: Array<{ node: Entity }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  findings?: {
    edges?: Array<{ node: Finding }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  identityHolders?: {
    edges?: Array<{ node: IdentityHolder }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  internalPolicies?: {
    edges?: Array<{ node: InternalPolicy }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  mappedControls?: {
    edges?: Array<{ node: MappedControl }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  narratives?: {
    edges?: Array<{ node: Narrative }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  platforms?: {
    edges?: Array<{ node: Platform }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  procedures?: {
    edges?: Array<{ node: Procedure }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  programs?: {
    edges?: Array<{ node: Program }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  remediations?: {
    edges?: Array<{ node: Remediation }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  reviews?: {
    edges?: Array<{ node: Review }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  risks?: {
    edges?: Array<{ node: Risk }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  scans?: {
    edges?: Array<{ node: Scan }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenters?: {
    edges?: Array<{ node: TrustCenter }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenterCompliances?: {
    edges?: Array<{ node: TrustCenterCompliance }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenterDocs?: {
    edges?: Array<{ node: TrustCenterDoc }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenterEntities?: {
    edges?: Array<{ node: TrustCenterEntity }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenterNdaRequests?: {
    edges?: Array<{ node: TrustCenterNdaRequest }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenterSettings?: {
    edges?: Array<{ node: TrustCenterSetting }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenterSubprocessors?: {
    edges?: Array<{ node: TrustCenterSubprocessor }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  trustCenterWatermarkConfigs?: {
    edges?: Array<{ node: TrustCenterWatermarkConfig }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  vulnerabilities?: {
    edges?: Array<{ node: Vulnerability }>
    pageInfo?: PageInfo
    totalCount?: number
  }
}

// Generated OBJECT_TYPE_PERMISSIONS_CONFIG
export type ObjectPermissionConfig = {
  roleOptions: string[]
  responseObjectKey: keyof PermissionsAllQueriesData
  queryDocument: string
  objectName: string
  searchAttribute: string
  inputPlaceholder: string
  excludeViewersInFilter?: boolean
  extraTableColumns?: any[]
}

export const OBJECT_TYPE_PERMISSIONS_CONFIG: Record<TypesWithPermissions, ObjectPermissionConfig> = {
  [TypesWithPermissions.ACTION_PLAN]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'actionPlans',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.ASSESSMENT]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'assessments',
    queryDocument: GET_ALL_ASSESSMENTS,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.ASSET]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'assets',
    queryDocument: GET_ALL_ASSETS,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.CAMPAIGN]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'campaigns',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.CONTROL]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'controls',
    queryDocument: GET_ALL_CONTROLS,
    objectName: 'refCode',
    searchAttribute: 'refCodeContainsFold',
    inputPlaceholder: 'ref code',
    excludeViewersInFilter: true,
    extraTableColumns: [
      {
        header: 'Reference Framework',
        accessorKey: 'referenceFramework',
        size: 200,
        minSize: 200,
        maxSize: 200,
      },
    ],
  },
  [TypesWithPermissions.CONTROL_IMPLEMENTATION]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controlImplementations',
    queryDocument: GET_ALL_CONTROL_IMPLEMENTATIONS,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.CONTROL_OBJECTIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controlObjectives',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.EMAIL_BRANDING]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'emailBrandings',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.ENTITY]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'entities',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.FINDING]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'findings',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.IDENTITY_HOLDER]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'identityHolders',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.INTERNAL_POLICY]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'internalPolicies',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.MAPPED_CONTROL]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'mappedControls',
    queryDocument: GET_ALL_MAPPED_CONTROLS,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.NARRATIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'narratives',
    queryDocument: GET_ALL_NARRATIVES,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.PLATFORM]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'platforms',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.PROCEDURE]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'procedures',
    queryDocument: GET_ALL_PROCEDURES,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.PROGRAM]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'programs',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.REMEDIATION]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'remediations',
    queryDocument: '',
    objectName: 'title',
    searchAttribute: 'titleContainsFold',
    inputPlaceholder: 'title',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.REVIEW]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'reviews',
    queryDocument: '',
    objectName: 'title',
    searchAttribute: 'titleContainsFold',
    inputPlaceholder: 'title',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.RISK]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'risks',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.SCAN]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'scans',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenters',
    queryDocument: GET_ALL_TRUST_CENTERS,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER_COMPLIANCE]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenterCompliances',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER_DOC]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenterDocs',
    queryDocument: '',
    objectName: 'title',
    searchAttribute: 'titleContainsFold',
    inputPlaceholder: 'title',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER_ENTITY]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenterEntities',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER_NDA_REQUEST]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenterNdaRequests',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER_SETTING]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenterSettings',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER_SUBPROCESSOR]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenterSubprocessors',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.TRUST_CENTER_WATERMARK_CONFIG]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'trustCenterWatermarkConfigs',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: true,
    extraTableColumns: undefined,
  },
  [TypesWithPermissions.VULNERABILITY]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'vulnerabilities',
    queryDocument: '',
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'name',
    excludeViewersInFilter: false,
    extraTableColumns: undefined,
  },
}

export enum TaskObjectTypes {
  ACTION_PLAN = 'Action Plan',
  CONTROL_IMPLEMENTATION = 'Control Implementation',
  CONTROL_OBJECTIVE = 'Control Objective',
  CONTROL = 'Control',
  EVIDENCE = 'Evidence',
  GROUP = 'Group',
  IDENTITY_HOLDER = 'Identity Holder',
  INTERNAL_POLICY = 'Internal Policy',
  PLATFORM = 'Platform',
  PROCEDURE = 'Procedure',
  PROGRAM = 'Program',
  RISK = 'Risk',
  SCAN = 'Scan',
  SUBCONTROL = 'Subcontrol',
}

export type TaskAllQueriesData = {
  actionPlans?: {
    edges?: Array<{ node: ActionPlan }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controlImplementations?: {
    edges?: Array<{ node: ControlImplementation }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controlObjectives?: {
    edges?: Array<{ node: ControlObjective }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controls?: {
    edges?: Array<{ node: Control }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  evidence?: {
    edges?: Array<{ node: Evidence }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  groups?: {
    edges?: Array<{ node: Group }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  identityHolders?: {
    edges?: Array<{ node: IdentityHolder }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  internalPolicies?: {
    edges?: Array<{ node: InternalPolicy }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  platforms?: {
    edges?: Array<{ node: Platform }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  procedures?: {
    edges?: Array<{ node: Procedure }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  programs?: {
    edges?: Array<{ node: Program }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  risks?: {
    edges?: Array<{ node: Risk }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  scans?: {
    edges?: Array<{ node: Scan }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  subcontrols?: {
    edges?: Array<{ node: Subcontrol }>
    pageInfo?: PageInfo
    totalCount?: number
  }
}
// Generated TASK_OBJECT_TYPE_CONFIG
export type TTaskObjectTypeConfig = {
  responseObjectKey: string
  queryDocument: string
  inputName: string
  placeholder: string
  searchAttribute: string
  objectName: string
}

export const TASK_OBJECT_TYPE_CONFIG: Record<TaskObjectTypes, TTaskObjectTypeConfig> = {
  [TaskObjectTypes.ACTION_PLAN]: {
    responseObjectKey: 'actionPlans',
    inputName: 'actionPlanIDs',
    placeholder: 'action plan',
    queryDocument: '',
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.CONTROL_IMPLEMENTATION]: {
    responseObjectKey: 'controlImplementations',
    inputName: 'controlImplementationIDs',
    placeholder: 'control implementation',
    queryDocument: GET_ALL_CONTROL_IMPLEMENTATIONS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'control objective',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.CONTROL]: {
    responseObjectKey: 'controls',
    inputName: 'controlIDs',
    placeholder: 'control',
    queryDocument: GET_ALL_CONTROLS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.EVIDENCE]: {
    responseObjectKey: 'evidences',
    inputName: 'evidenceIDs',
    placeholder: 'evidence',
    queryDocument: GET_ALL_EVIDENCES,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.GROUP]: {
    responseObjectKey: 'groups',
    inputName: 'groupIDs',
    placeholder: 'group',
    queryDocument: GET_ALL_GROUPS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.IDENTITY_HOLDER]: {
    responseObjectKey: 'identityHolders',
    inputName: 'identityHolderIDs',
    placeholder: 'identity holder',
    queryDocument: '',
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.INTERNAL_POLICY]: {
    responseObjectKey: 'internalPolicies',
    inputName: 'internalPolicyIDs',
    placeholder: 'internal policy',
    queryDocument: '',
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.PLATFORM]: {
    responseObjectKey: 'platforms',
    inputName: 'platformIDs',
    placeholder: 'platform',
    queryDocument: '',
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.PROCEDURE]: {
    responseObjectKey: 'procedures',
    inputName: 'procedureIDs',
    placeholder: 'procedure',
    queryDocument: GET_ALL_PROCEDURES,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.PROGRAM]: {
    responseObjectKey: 'programs',
    inputName: 'programIDs',
    placeholder: 'program',
    queryDocument: '',
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.RISK]: {
    responseObjectKey: 'risks',
    inputName: 'riskIDs',
    placeholder: 'risk',
    queryDocument: '',
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.SCAN]: {
    responseObjectKey: 'scans',
    inputName: 'scanIDs',
    placeholder: 'scan',
    queryDocument: '',
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.SUBCONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'subcontrol',
    queryDocument: GET_ALL_SUBCONTROLS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
}
