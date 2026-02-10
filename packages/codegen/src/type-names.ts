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
