import { GET_ALL_ASSETS } from '@repo/codegen/query/asset'
import { GET_ALL_CAMPAIGNS } from '@repo/codegen/query/campaign'
import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_IMPLEMENTATIONS } from '@repo/codegen/query/control-implementation'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_ENTITIES } from '@repo/codegen/query/entity'
import { GET_ALL_EVIDENCES } from '@repo/codegen/query/evidence'
import { GET_ALL_GROUPS } from '@repo/codegen/query/group'
import { GET_ALL_IDENTITY_HOLDERS } from '@repo/codegen/query/identity-holder'
import { GET_ALL_INTERNAL_POLICIES } from '@repo/codegen/query/internal-policy'
import { GET_ALL_PROCEDURES } from '@repo/codegen/query/procedure'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/program'
import { GET_ALL_FINDINGS } from '@repo/codegen/query/finding'
import { GET_ALL_REMEDIATIONS } from '@repo/codegen/query/remediation'
import { GET_ALL_REVIEWS } from '@repo/codegen/query/review'
import { GET_ALL_VULNERABILITIES } from '@repo/codegen/query/vulnerability'
import { GET_ALL_RISKS } from '@repo/codegen/query/risk'
import { GET_ALL_SCANS } from '@repo/codegen/query/scan'
import { GET_ALL_SUBCONTROLS } from '@repo/codegen/query/subcontrol'
import { TASKS_WITH_FILTER } from '@repo/codegen/query/task'
import { GET_ALL_ACTION_PLANS } from '@repo/codegen/query/action-plan'

import {
  type Asset,
  type Campaign,
  type Control,
  type ControlImplementation,
  type Subcontrol,
  type ControlObjective,
  type Entity,
  type Finding,
  type Program,
  type TaskEdge,
  type Evidence,
  type Group,
  type IdentityHolder,
  type InternalPolicy,
  type Procedure,
  type Remediation,
  type Review,
  type Scan,
  type Vulnerability,
  type PageInfo,
  ControlObjectiveObjectiveStatus,
  OrderDirection,
  AssetOrderField,
  CampaignOrderField,
  ControlImplementationOrderField,
  ControlObjectiveOrderField,
  ControlOrderField,
  EntityOrderField,
  EvidenceOrderField,
  FindingOrderField,
  GroupOrderField,
  IdentityHolderOrderField,
  InternalPolicyOrderField,
  ProcedureOrderField,
  ProgramOrderField,
  RemediationOrderField,
  ReviewOrderField,
  RiskOrderField,
  ScanOrderField,
  SubcontrolOrderField,
  TaskOrderField,
  VulnerabilityOrderField,
  ActionPlanOrderField,
} from '@repo/codegen/src/schema'
import { type useQueryClient } from '@tanstack/react-query'
import { type RequestDocument } from 'graphql-request'

import {
  type AssetsWithFilterQuery,
  type CampaignsWithFilterQuery,
  type GetAllControlImplementationsQuery,
  type GetAllControlObjectivesQuery,
  type GetAllControlsQuery,
  type GetAllEvidencesQuery,
  type GetAllGroupsQuery,
  type GetAllInternalPoliciesQuery,
  type GetAllProceduresWithDetailsQuery,
  type GetAllProgramsQuery,
  type GetAllRisksQuery,
  type GetAllSubcontrolsQuery,
  type EntitiesWithFilterQuery,
  type FindingsWithFilterQuery,
  type IdentityHoldersWithFilterQuery,
  type RemediationsWithFilterQuery,
  type ReviewsWithFilterQuery,
  type ScansWithFilterQuery,
  type TasksWithFilterQuery,
  type VulnerabilitiesWithFilterQuery,
} from '@repo/codegen/src/schema'
import type {
  ActionPlansWithFilterQuery,
  RiskEdge,
  UpdateAssetInput,
  UpdateControlInput,
  UpdateEntityInput,
  UpdateFindingInput,
  UpdateIdentityHolderInput,
  UpdateInternalPolicyInput,
  UpdateProcedureInput,
  UpdateRemediationInput,
  UpdateReviewInput,
  UpdateRiskInput,
  UpdateSubcontrolInput,
  UpdateVulnerabilityInput,
} from '@repo/codegen/src/schema'

export type QueryResponse =
  | ActionPlansWithFilterQuery
  | GetAllControlsQuery
  | GetAllControlImplementationsQuery
  | GetAllSubcontrolsQuery
  | GetAllControlObjectivesQuery
  | GetAllProgramsQuery
  | TasksWithFilterQuery
  | GetAllEvidencesQuery
  | GetAllGroupsQuery
  | GetAllInternalPoliciesQuery
  | GetAllProceduresWithDetailsQuery
  | GetAllRisksQuery
  | ScansWithFilterQuery
  | CampaignsWithFilterQuery
  | AssetsWithFilterQuery
  | EntitiesWithFilterQuery
  | FindingsWithFilterQuery
  | IdentityHoldersWithFilterQuery
  | RemediationsWithFilterQuery
  | ReviewsWithFilterQuery
  | VulnerabilitiesWithFilterQuery

type QueryResponseMapKey =
  | 'actionPlans'
  | 'controls'
  | 'controlImplementations'
  | 'subcontrols'
  | 'controlObjectives'
  | 'programs'
  | 'tasks'
  | 'evidences'
  | 'groups'
  | 'internalPolicies'
  | 'procedures'
  | 'risks'
  | 'scans'
  | 'campaigns'
  | 'assets'
  | 'entities'
  | 'findings'
  | 'identityHolders'
  | 'remediations'
  | 'reviews'
  | 'vulnerabilities'

export type AllObjectQueriesData = {
  actionPlans?: {
    edges?: Array<{ node: { id: string; title: string; displayID: string } }>
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
  subcontrols?: {
    edges?: Array<{ node: Subcontrol }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controlObjectives?: {
    edges?: Array<{ node: ControlObjective }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  programs?: {
    edges?: Array<{ node: Program }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  evidences?: {
    edges?: Array<{ node: Evidence }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  groups?: {
    edges?: Array<{ node: Group }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  internalPolicies?: {
    edges?: Array<{ node: InternalPolicy }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  procedures?: {
    edges?: Array<{ node: Procedure }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  tasks?: {
    edges?: Array<{ node: TaskEdge }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  risks?: {
    edges?: Array<{ node: RiskEdge }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  scans?: {
    edges?: Array<{ node: Scan }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  campaigns?: {
    edges?: Array<{ node: Campaign }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  assets?: {
    edges?: Array<{ node: Asset }>
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
  vulnerabilities?: {
    edges?: Array<{ node: Vulnerability }>
    pageInfo?: PageInfo
    totalCount?: number
  }
}

export type AllObjectQueriesDataKey = keyof AllObjectQueriesData

export enum ObjectTypeObjects {
  ACTION_PLAN = 'Action Plan',
  CONTROL = 'Control',
  CONTROL_IMPLEMENTATION = 'Control Implementation',
  SUB_CONTROL = 'Subcontrol',
  CONTROL_OBJECTIVE = 'Control Objective',
  PROGRAM = 'Program',
  TASK = 'Task',
  EVIDENCE = 'Evidence',
  GROUP = 'Group',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
  RISK = 'Risk',
  SCAN = 'Scan',
  CAMPAIGN = 'Campaign',
  ASSET = 'Asset',
  ENTITY = 'Vendor',
  FINDING = 'Finding',
  IDENTITY_HOLDER = 'Personnel',
  REMEDIATION = 'Remediation',
  REVIEW = 'Review',
  VULNERABILITY = 'Vulnerability',
}

type ObjectQueryConfig = {
  responseObjectKey: AllObjectQueriesDataKey
  queryDocument: RequestDocument
  inputName: string
  placeholder: string
  defaultOrderBy?: Array<{ field: string; direction: OrderDirection }>
}

export const OBJECT_QUERY_CONFIG: Record<ObjectTypeObjects, ObjectQueryConfig> = {
  [ObjectTypeObjects.ACTION_PLAN]: {
    responseObjectKey: 'actionPlans',
    inputName: 'actionPlanIDs',
    placeholder: 'Search action plans',
    queryDocument: GET_ALL_ACTION_PLANS,
    defaultOrderBy: [{ field: ActionPlanOrderField.title, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.CONTROL]: {
    responseObjectKey: 'controls',
    inputName: 'controlIDs',
    placeholder: 'Search controls',
    queryDocument: GET_ALL_CONTROLS,
    defaultOrderBy: [{ field: ControlOrderField.ref_code, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: {
    responseObjectKey: 'controlImplementations',
    inputName: 'controlImplementationIDs',
    placeholder: 'Search control implementations',
    queryDocument: GET_ALL_CONTROL_IMPLEMENTATIONS,
    defaultOrderBy: [{ field: ControlImplementationOrderField.created_at, direction: OrderDirection.DESC }],
  },
  [ObjectTypeObjects.SUB_CONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'Search subcontrols',
    queryDocument: GET_ALL_SUBCONTROLS,
    defaultOrderBy: [{ field: SubcontrolOrderField.ref_code, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'Search control objectives',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
    defaultOrderBy: [{ field: ControlObjectiveOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.PROGRAM]: {
    responseObjectKey: 'programs',
    inputName: 'programIDs',
    placeholder: 'Search programs',
    queryDocument: GET_ALL_PROGRAMS,
    defaultOrderBy: [{ field: ProgramOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.TASK]: {
    responseObjectKey: 'tasks',
    inputName: 'taskIDs',
    placeholder: 'Search tasks',
    queryDocument: TASKS_WITH_FILTER,
    defaultOrderBy: [{ field: TaskOrderField.title, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.EVIDENCE]: {
    responseObjectKey: 'evidences',
    inputName: 'evidenceIDs',
    placeholder: 'Search evidence',
    queryDocument: GET_ALL_EVIDENCES,
    defaultOrderBy: [{ field: EvidenceOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.GROUP]: {
    responseObjectKey: 'groups',
    inputName: 'groupIDs',
    placeholder: 'Search groups',
    queryDocument: GET_ALL_GROUPS,
    defaultOrderBy: [{ field: GroupOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.INTERNAL_POLICY]: {
    responseObjectKey: 'internalPolicies',
    inputName: 'internalPolicyIDs',
    placeholder: 'Search internal policies',
    queryDocument: GET_ALL_INTERNAL_POLICIES,
    defaultOrderBy: [{ field: InternalPolicyOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.PROCEDURE]: {
    responseObjectKey: 'procedures',
    inputName: 'procedureIDs',
    placeholder: 'Search procedures',
    queryDocument: GET_ALL_PROCEDURES,
    defaultOrderBy: [{ field: ProcedureOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.RISK]: {
    responseObjectKey: 'risks',
    inputName: 'riskIDs',
    placeholder: 'Search risks',
    queryDocument: GET_ALL_RISKS,
    defaultOrderBy: [{ field: RiskOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.SCAN]: {
    responseObjectKey: 'scans',
    inputName: 'scanIDs',
    placeholder: 'Search scans',
    queryDocument: GET_ALL_SCANS,
    defaultOrderBy: [{ field: ScanOrderField.created_at, direction: OrderDirection.DESC }],
  },
  [ObjectTypeObjects.CAMPAIGN]: {
    responseObjectKey: 'campaigns',
    inputName: 'campaignIDs',
    placeholder: 'Search campaigns',
    queryDocument: GET_ALL_CAMPAIGNS,
    defaultOrderBy: [{ field: CampaignOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.ASSET]: {
    responseObjectKey: 'assets',
    inputName: 'assetIDs',
    placeholder: 'Search assets',
    queryDocument: GET_ALL_ASSETS,
    defaultOrderBy: [{ field: AssetOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.ENTITY]: {
    responseObjectKey: 'entities',
    inputName: 'entityIDs',
    placeholder: 'Search vendors',
    queryDocument: GET_ALL_ENTITIES,
    defaultOrderBy: [{ field: EntityOrderField.name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.FINDING]: {
    responseObjectKey: 'findings',
    inputName: 'findingIDs',
    placeholder: 'Search findings',
    queryDocument: GET_ALL_FINDINGS,
    defaultOrderBy: [{ field: FindingOrderField.external_id, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.IDENTITY_HOLDER]: {
    responseObjectKey: 'identityHolders',
    inputName: 'identityHolderIDs',
    placeholder: 'Search personnel',
    queryDocument: GET_ALL_IDENTITY_HOLDERS,
    defaultOrderBy: [{ field: IdentityHolderOrderField.full_name, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.REMEDIATION]: {
    responseObjectKey: 'remediations',
    inputName: 'remediationIDs',
    placeholder: 'Search remediations',
    queryDocument: GET_ALL_REMEDIATIONS,
    defaultOrderBy: [{ field: RemediationOrderField.title, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.REVIEW]: {
    responseObjectKey: 'reviews',
    inputName: 'reviewIDs',
    placeholder: 'Search reviews',
    queryDocument: GET_ALL_REVIEWS,
    defaultOrderBy: [{ field: ReviewOrderField.title, direction: OrderDirection.ASC }],
  },
  [ObjectTypeObjects.VULNERABILITY]: {
    responseObjectKey: 'vulnerabilities',
    inputName: 'vulnerabilityIDs',
    placeholder: 'Search vulnerabilities',
    queryDocument: GET_ALL_VULNERABILITIES,
    defaultOrderBy: [{ field: VulnerabilityOrderField.cve_id, direction: OrderDirection.ASC }],
  },
}

export const invalidateTaskAssociations = (payload: Record<string, unknown>, queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] })

  Object.values(OBJECT_QUERY_CONFIG).forEach((config) => {
    const fieldValue = payload[config.inputName]
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      queryClient.invalidateQueries({ queryKey: [config.responseObjectKey] })
    }
  })
}

export function getPagination(objectKey: QueryResponseMapKey | undefined, data: QueryResponse | undefined): { pageInfo?: PageInfo; totalCount?: number } {
  if (!objectKey || !data) return {}

  switch (objectKey) {
    case 'actionPlans': {
      const typed = data as ActionPlansWithFilterQuery
      return { pageInfo: typed.actionPlans?.pageInfo, totalCount: typed.actionPlans?.totalCount }
    }
    case 'controls': {
      const typed = data as GetAllControlsQuery
      return { pageInfo: typed.controls.pageInfo, totalCount: typed.controls.totalCount }
    }
    case 'controlImplementations': {
      const typed = data as GetAllControlImplementationsQuery
      return { pageInfo: typed.controlImplementations.pageInfo, totalCount: typed.controlImplementations.totalCount }
    }
    case 'subcontrols': {
      const typed = data as GetAllSubcontrolsQuery
      return { pageInfo: typed.subcontrols.pageInfo, totalCount: typed.subcontrols.totalCount }
    }
    case 'controlObjectives': {
      const typed = data as GetAllControlObjectivesQuery
      return { pageInfo: typed.controlObjectives.pageInfo, totalCount: typed.controlObjectives.totalCount }
    }
    case 'programs': {
      const typed = data as GetAllProgramsQuery
      return { pageInfo: typed.programs.pageInfo, totalCount: typed.programs.totalCount }
    }
    case 'tasks': {
      const typed = data as TasksWithFilterQuery
      return { pageInfo: typed.tasks.pageInfo, totalCount: typed.tasks.totalCount }
    }
    case 'evidences': {
      const typed = data as GetAllEvidencesQuery
      return { pageInfo: typed.evidences.pageInfo, totalCount: typed.evidences.totalCount }
    }
    case 'groups': {
      const typed = data as GetAllGroupsQuery
      return { pageInfo: typed.groups.pageInfo, totalCount: typed.groups.totalCount }
    }
    case 'internalPolicies': {
      const typed = data as GetAllInternalPoliciesQuery
      return { pageInfo: typed.internalPolicies.pageInfo, totalCount: typed.internalPolicies.totalCount }
    }
    case 'procedures': {
      const typed = data as GetAllProceduresWithDetailsQuery
      return { pageInfo: typed.procedures.pageInfo, totalCount: typed.procedures.totalCount }
    }
    case 'risks': {
      const typed = data as GetAllRisksQuery
      return { pageInfo: typed.risks.pageInfo, totalCount: typed.risks.totalCount }
    }
    case 'scans': {
      const typed = data as ScansWithFilterQuery
      return { pageInfo: typed.scans.pageInfo, totalCount: typed.scans.totalCount }
    }
    case 'campaigns': {
      const typed = data as CampaignsWithFilterQuery
      return { pageInfo: typed.campaigns.pageInfo, totalCount: typed.campaigns.totalCount }
    }
    case 'assets': {
      const typed = data as AssetsWithFilterQuery
      return { pageInfo: typed.assets.pageInfo, totalCount: typed.assets.totalCount }
    }
    case 'entities': {
      const typed = data as EntitiesWithFilterQuery
      return { pageInfo: typed.entities.pageInfo, totalCount: typed.entities.totalCount }
    }
    case 'findings': {
      const typed = data as FindingsWithFilterQuery
      return { pageInfo: typed.findings.pageInfo, totalCount: typed.findings.totalCount }
    }
    case 'identityHolders': {
      const typed = data as IdentityHoldersWithFilterQuery
      return { pageInfo: typed.identityHolders.pageInfo, totalCount: typed.identityHolders.totalCount }
    }
    case 'remediations': {
      const typed = data as RemediationsWithFilterQuery
      return { pageInfo: typed.remediations.pageInfo, totalCount: typed.remediations.totalCount }
    }
    case 'reviews': {
      const typed = data as ReviewsWithFilterQuery
      return { pageInfo: typed.reviews.pageInfo, totalCount: typed.reviews.totalCount }
    }
    case 'vulnerabilities': {
      const typed = data as VulnerabilitiesWithFilterQuery
      return { pageInfo: typed.vulnerabilities.pageInfo, totalCount: typed.vulnerabilities.totalCount }
    }
    default:
      return {}
  }
}

export type TableRow = {
  id?: string
  name?: string
  inputName?: string
  refCode?: string
  referenceFramework?: string | null
}

export function extractTableRows(objectKey: QueryResponseMapKey | undefined, data: QueryResponse | undefined, inputName?: string): TableRow[] {
  if (!objectKey || !data) return []

  const selectedInputName = inputName || ''

  switch (objectKey) {
    case 'actionPlans': {
      const items = (data as ActionPlansWithFilterQuery).actionPlans?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.title ?? '',
        inputName: selectedInputName,
      }))
    }

    case 'controls': {
      const items = (data as GetAllControlsQuery).controls?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.refCode,
        inputName: selectedInputName,
        refCode: item?.node?.refCode ?? '',
        referenceFramework: item?.node?.referenceFramework ?? null,
      }))
    }
    case 'controlImplementations': {
      const items = (data as GetAllControlImplementationsQuery).controlImplementations?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.controls?.edges?.[0]?.node?.refCode ? `Control Implementation for ${item.node.controls.edges[0].node.refCode}` : (item?.node?.details?.slice(0, 50) ?? ''),
        inputName: selectedInputName,
        refCode: '',
        controls: item?.node?.controls,
      }))
    }

    case 'subcontrols': {
      const items = (data as GetAllSubcontrolsQuery).subcontrols?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.refCode,
        inputName: selectedInputName,
        refCode: item?.node?.refCode ?? '',
        referenceFramework: item?.node?.referenceFramework ?? null,
      }))
    }

    case 'controlObjectives': {
      const items = (data as GetAllControlObjectivesQuery).controlObjectives?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: '',
      }))
    }

    case 'programs': {
      const items = (data as GetAllProgramsQuery).programs?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'tasks': {
      const items = (data as TasksWithFilterQuery).tasks?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.title ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'evidences': {
      const items = (data as GetAllEvidencesQuery).evidences?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'groups': {
      const items = (data as GetAllGroupsQuery).groups?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.name ?? '',
      }))
    }

    case 'internalPolicies': {
      const items = (data as GetAllInternalPoliciesQuery).internalPolicies?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.name ?? '',
      }))
    }

    case 'procedures': {
      const items = (data as GetAllProceduresWithDetailsQuery).procedures?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: '',
      }))
    }

    case 'risks': {
      const items = (data as GetAllRisksQuery).risks?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'scans': {
      const items = (data as ScansWithFilterQuery).scans?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.target ?? '',
        inputName: selectedInputName,
        refCode: '',
      }))
    }

    case 'campaigns': {
      const items = (data as CampaignsWithFilterQuery).campaigns?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'assets': {
      const items = (data as AssetsWithFilterQuery).assets?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayName ?? '',
      }))
    }

    case 'entities': {
      const items = (data as EntitiesWithFilterQuery).entities?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayName ?? '',
      }))
    }

    case 'findings': {
      const items = (data as FindingsWithFilterQuery).findings?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.displayName ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'identityHolders': {
      const items = (data as IdentityHoldersWithFilterQuery).identityHolders?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.fullName ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'remediations': {
      const items = (data as RemediationsWithFilterQuery).remediations?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.title ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    case 'reviews': {
      const items = (data as ReviewsWithFilterQuery).reviews?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.title ?? '',
        inputName: selectedInputName,
        refCode: '',
      }))
    }

    case 'vulnerabilities': {
      const items = (data as VulnerabilitiesWithFilterQuery).vulnerabilities?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.displayName ?? '',
        inputName: selectedInputName,
        refCode: item?.node?.displayID ?? '',
      }))
    }

    default:
      return []
  }
}

export const generateWhere = (selectedObject: ObjectTypeObjects | null, searchValue: string, ownerID: string) => {
  if (!selectedObject) return {}

  const mandatoryFilterMap: Partial<Record<ObjectTypeObjects, Record<string, unknown>>> = {
    [ObjectTypeObjects.ACTION_PLAN]: { ownerID: ownerID },
    [ObjectTypeObjects.CONTROL]: { systemOwned: false, isTrustCenterControl: false },
    [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: {},
    [ObjectTypeObjects.SUB_CONTROL]: { systemOwned: false },
    [ObjectTypeObjects.CONTROL_OBJECTIVE]: { ownerID: ownerID },
    [ObjectTypeObjects.PROGRAM]: { ownerID: ownerID },
    [ObjectTypeObjects.TASK]: { ownerID: ownerID },
    [ObjectTypeObjects.EVIDENCE]: { ownerID: ownerID },
    [ObjectTypeObjects.GROUP]: { ownerID: ownerID },
    [ObjectTypeObjects.INTERNAL_POLICY]: { systemOwned: false },
    [ObjectTypeObjects.PROCEDURE]: { systemOwned: false },
    [ObjectTypeObjects.RISK]: { ownerID: ownerID },
    [ObjectTypeObjects.SCAN]: {},
    [ObjectTypeObjects.CAMPAIGN]: { ownerID: ownerID },
    [ObjectTypeObjects.ASSET]: { ownerID: ownerID },
    [ObjectTypeObjects.ENTITY]: { systemOwned: false },
    [ObjectTypeObjects.FINDING]: {},
    [ObjectTypeObjects.IDENTITY_HOLDER]: { ownerID: ownerID },
    [ObjectTypeObjects.REMEDIATION]: {},
    [ObjectTypeObjects.REVIEW]: {},
    [ObjectTypeObjects.VULNERABILITY]: {},
  }

  const searchAttributeMap: Partial<Record<ObjectTypeObjects, string>> = {
    [ObjectTypeObjects.ACTION_PLAN]: 'titleContainsFold',
    [ObjectTypeObjects.CONTROL]: 'refCodeContainsFold',
    [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: 'detailsContainsFold',
    [ObjectTypeObjects.SUB_CONTROL]: 'refCodeContainsFold',
    [ObjectTypeObjects.CONTROL_OBJECTIVE]: 'nameContainsFold',
    [ObjectTypeObjects.PROGRAM]: 'nameContainsFold',
    [ObjectTypeObjects.TASK]: 'titleContainsFold',
    [ObjectTypeObjects.EVIDENCE]: 'nameContainsFold',
    [ObjectTypeObjects.GROUP]: 'nameContainsFold',
    [ObjectTypeObjects.INTERNAL_POLICY]: 'nameContainsFold',
    [ObjectTypeObjects.PROCEDURE]: 'nameContainsFold',
    [ObjectTypeObjects.RISK]: 'nameContainsFold',
    [ObjectTypeObjects.SCAN]: 'targetContainsFold',
    [ObjectTypeObjects.CAMPAIGN]: 'nameContainsFold',
    [ObjectTypeObjects.ASSET]: 'nameContainsFold',
    [ObjectTypeObjects.ENTITY]: 'nameContainsFold',
    [ObjectTypeObjects.FINDING]: 'displayNameContainsFold',
    [ObjectTypeObjects.IDENTITY_HOLDER]: 'fullNameContainsFold',
    [ObjectTypeObjects.REMEDIATION]: 'titleContainsFold',
    [ObjectTypeObjects.REVIEW]: 'titleContainsFold',
    [ObjectTypeObjects.VULNERABILITY]: 'displayNameContainsFold',
  }

  const secondarySearchMap: Partial<Record<ObjectTypeObjects, string>> = {
    [ObjectTypeObjects.ACTION_PLAN]: 'descriptionContainsFold',
    [ObjectTypeObjects.CONTROL]: 'descriptionContainsFold',
    [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: 'statusContainsFold',
    [ObjectTypeObjects.SUB_CONTROL]: 'descriptionContainsFold',
    [ObjectTypeObjects.CONTROL_OBJECTIVE]: 'desiredOutcomeContainsFold',
    [ObjectTypeObjects.PROGRAM]: 'descriptionContainsFold',
    [ObjectTypeObjects.TASK]: 'detailsContainsFold',
    [ObjectTypeObjects.EVIDENCE]: 'descriptionContainsFold',
    [ObjectTypeObjects.INTERNAL_POLICY]: 'detailsContainsFold',
    [ObjectTypeObjects.RISK]: 'detailsContainsFold',
    [ObjectTypeObjects.SCAN]: 'descriptionContainsFold',
    [ObjectTypeObjects.CAMPAIGN]: 'descriptionContainsFold',
    [ObjectTypeObjects.ENTITY]: 'displayNameContainsFold',
    [ObjectTypeObjects.FINDING]: 'descriptionContainsFold',
    [ObjectTypeObjects.IDENTITY_HOLDER]: 'emailContainsFold',
    [ObjectTypeObjects.REMEDIATION]: 'summaryContainsFold',
    [ObjectTypeObjects.REVIEW]: 'summaryContainsFold',
    [ObjectTypeObjects.VULNERABILITY]: 'descriptionContainsFold',
  }

  const defaultWhereMap: Partial<Record<ObjectTypeObjects, Record<string, unknown>>> = {
    [ObjectTypeObjects.CONTROL_OBJECTIVE]: {
      statusNEQ: ControlObjectiveObjectiveStatus.ARCHIVED,
    },
  }

  const mandatoryWhere = mandatoryFilterMap[selectedObject] ?? {}
  const defaultWhere = defaultWhereMap[selectedObject] ?? {}
  const searchAttribute = searchAttributeMap[selectedObject]
  const secondaryAttribute = secondarySearchMap[selectedObject]

  if (!searchValue) {
    return { ...mandatoryWhere, ...defaultWhere }
  }

  const orFilters = secondaryAttribute ? [{ [searchAttribute ?? '']: searchValue }, { [secondaryAttribute]: searchValue }] : [{ [searchAttribute ?? '']: searchValue }]

  return {
    ...mandatoryWhere,
    ...defaultWhere,
    or: orFilters,
  }
}

//REMOVE ASSOCIATION CHIP

type TObjectAssociationInputName = (typeof OBJECT_QUERY_CONFIG)[keyof typeof OBJECT_QUERY_CONFIG]['inputName']
type TRemoveFieldName<TInputName extends string> = `remove${Capitalize<TInputName>}`

type TAssociationSectionDefinition = {
  dataField: AllObjectQueriesDataKey
  inputName: TObjectAssociationInputName
}

export const ASSOCIATION_SECTION_CONFIG = {
  controls: { dataField: 'controls', inputName: 'controlIDs' },
  controlImplementations: { dataField: 'controlImplementations', inputName: 'controlImplementationIDs' },
  subcontrols: { dataField: 'subcontrols', inputName: 'subcontrolIDs' },
  controlObjectives: { dataField: 'controlObjectives', inputName: 'controlObjectiveIDs' },
  policies: { dataField: 'internalPolicies', inputName: 'internalPolicyIDs' },
  procedures: { dataField: 'procedures', inputName: 'procedureIDs' },
  programs: { dataField: 'programs', inputName: 'programIDs' },
  tasks: { dataField: 'tasks', inputName: 'taskIDs' },
  risks: { dataField: 'risks', inputName: 'riskIDs' },
  evidences: { dataField: 'evidences', inputName: 'evidenceIDs' },
  groups: { dataField: 'groups', inputName: 'groupIDs' },
  scans: { dataField: 'scans', inputName: 'scanIDs' },
  campaigns: { dataField: 'campaigns', inputName: 'campaignIDs' },
  assets: { dataField: 'assets', inputName: 'assetIDs' },
  entities: { dataField: 'entities', inputName: 'entityIDs' },
  findings: { dataField: 'findings', inputName: 'findingIDs' },
  identityHolders: { dataField: 'identityHolders', inputName: 'identityHolderIDs' },
  remediations: { dataField: 'remediations', inputName: 'remediationIDs' },
  reviews: { dataField: 'reviews', inputName: 'reviewIDs' },
  vulnerabilities: { dataField: 'vulnerabilities', inputName: 'vulnerabilityIDs' },
  actionPlans: { dataField: 'actionPlans', inputName: 'actionPlanIDs' },
} as const satisfies Record<string, TAssociationSectionDefinition>

export type AssociationSectionKey = keyof typeof ASSOCIATION_SECTION_CONFIG

const SECTION_DISPLAY_NAMES_OVERRIDES: Partial<Record<AssociationSectionKey, string>> = {
  actionPlans: 'Action Plans',
  controlImplementations: 'Control Implementations',
  controlObjectives: 'Control Objectives',
  entities: 'Vendors',
  identityHolders: 'Personnel',
}

export const getSectionDisplayName = (key: string): string => {
  return SECTION_DISPLAY_NAMES_OVERRIDES[key as AssociationSectionKey] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

type TAssociationRemovalConfig<TInput extends object, TSectionKey extends AssociationSectionKey> = {
  sectionKeyToDataField: Record<TSectionKey, (typeof ASSOCIATION_SECTION_CONFIG)[TSectionKey]['dataField']>
  sectionKeyToRemoveField: Record<TSectionKey, Extract<TRemoveFieldName<(typeof ASSOCIATION_SECTION_CONFIG)[TSectionKey]['inputName']>, keyof TInput & string>>
  sectionKeyToInvalidateQueryKey: Record<TSectionKey, readonly unknown[]>
}

export const toRemoveFieldName = <TInputName extends TObjectAssociationInputName>(inputName: TInputName): TRemoveFieldName<TInputName> => {
  return `remove${inputName.charAt(0).toUpperCase()}${inputName.slice(1)}` as TRemoveFieldName<TInputName>
}

export const ASSOCIATION_SECTION_QUERY_KEY = {
  controls: ['controls'],
  controlImplementations: ['controlImplementations'],
  subcontrols: ['subcontrols'],
  controlObjectives: ['controlObjectives'],
  policies: ['internalPolicies'],
  procedures: ['procedures'],
  programs: ['programs'],
  tasks: ['tasks'],
  risks: ['risks'],
  evidences: ['evidences'],
  groups: ['groups'],
  scans: ['scans'],
  campaigns: ['campaigns'],
  assets: ['assets'],
  entities: ['entities'],
  findings: ['findings'],
  identityHolders: ['identityHolders'],
  remediations: ['remediations'],
  reviews: ['reviews'],
  vulnerabilities: ['vulnerabilities'],
  actionPlans: ['actionPlans'],
} as const satisfies Record<AssociationSectionKey, readonly [string]>

const createAssociationRemovalConfig =
  <TInput extends object>() =>
  <TSectionKey extends AssociationSectionKey>(sections: readonly TSectionKey[]): TAssociationRemovalConfig<TInput, TSectionKey> => {
    const sectionKeyToDataField = {} as TAssociationRemovalConfig<TInput, TSectionKey>['sectionKeyToDataField']
    const sectionKeyToRemoveField = {} as TAssociationRemovalConfig<TInput, TSectionKey>['sectionKeyToRemoveField']
    const sectionKeyToInvalidateQueryKey = {} as TAssociationRemovalConfig<TInput, TSectionKey>['sectionKeyToInvalidateQueryKey']

    for (const sectionKey of sections) {
      const sectionConfig = ASSOCIATION_SECTION_CONFIG[sectionKey]

      sectionKeyToDataField[sectionKey] = sectionConfig.dataField
      sectionKeyToRemoveField[sectionKey] = toRemoveFieldName(sectionConfig.inputName) as TAssociationRemovalConfig<TInput, TSectionKey>['sectionKeyToRemoveField'][TSectionKey]
      sectionKeyToInvalidateQueryKey[sectionKey] = ASSOCIATION_SECTION_QUERY_KEY[sectionKey]
    }

    return {
      sectionKeyToDataField,
      sectionKeyToRemoveField,
      sectionKeyToInvalidateQueryKey,
    }
  }

const CONTROL_ASSOCIATION_SECTIONS = [
  'policies',
  'procedures',
  'tasks',
  'programs',
  'risks',
  'subcontrols',
  'assets',
  'scans',
  'entities',
  'findings',
  'identityHolders',
  'campaigns',
  'remediations',
  'reviews',
] as const
const SUBCONTROL_ASSOCIATION_SECTIONS = ['policies', 'procedures', 'tasks', 'risks', 'assets', 'entities', 'identityHolders'] as const
const POLICY_ASSOCIATION_SECTIONS = ['procedures', 'controls', 'subcontrols', 'controlObjectives', 'tasks', 'programs', 'risks', 'assets', 'entities', 'identityHolders'] as const
const PROCEDURE_ASSOCIATION_SECTIONS = ['policies', 'controls', 'subcontrols', 'risks', 'tasks', 'programs'] as const
const RISK_ASSOCIATION_SECTIONS = ['controls', 'procedures', 'subcontrols', 'programs', 'tasks', 'policies', 'assets', 'entities', 'scans', 'remediations', 'reviews', 'actionPlans'] as const
const ASSET_ASSOCIATION_SECTIONS = ['scans', 'entities', 'identityHolders', 'controls', 'subcontrols', 'policies'] as const
const ENTITY_ASSOCIATION_SECTIONS = ['assets', 'scans', 'campaigns', 'identityHolders', 'controls', 'subcontrols', 'policies'] as const
const IDENTITY_HOLDER_ASSOCIATION_SECTIONS = ['assets', 'controls', 'subcontrols', 'entities', 'campaigns', 'policies', 'tasks'] as const
const FINDING_ASSOCIATION_SECTIONS = ['controls', 'subcontrols', 'risks', 'programs', 'tasks', 'assets', 'scans', 'remediations', 'reviews'] as const
const REVIEW_ASSOCIATION_SECTIONS = ['controls', 'subcontrols', 'remediations', 'entities', 'tasks', 'assets', 'programs'] as const
const REMEDIATION_ASSOCIATION_SECTIONS = ['controls', 'subcontrols', 'findings', 'vulnerabilities'] as const
const VULNERABILITY_ASSOCIATION_SECTIONS = ['controls', 'subcontrols', 'findings', 'remediations', 'reviews', 'assets', 'tasks'] as const

export const ASSOCIATION_REMOVAL_CONFIG = {
  control: createAssociationRemovalConfig<UpdateControlInput>()(CONTROL_ASSOCIATION_SECTIONS),
  subcontrol: createAssociationRemovalConfig<UpdateSubcontrolInput>()(SUBCONTROL_ASSOCIATION_SECTIONS),
  policy: createAssociationRemovalConfig<UpdateInternalPolicyInput>()(POLICY_ASSOCIATION_SECTIONS),
  procedure: createAssociationRemovalConfig<UpdateProcedureInput>()(PROCEDURE_ASSOCIATION_SECTIONS),
  risk: createAssociationRemovalConfig<UpdateRiskInput>()(RISK_ASSOCIATION_SECTIONS),
  asset: createAssociationRemovalConfig<UpdateAssetInput>()(ASSET_ASSOCIATION_SECTIONS),
  entity: createAssociationRemovalConfig<UpdateEntityInput>()(ENTITY_ASSOCIATION_SECTIONS),
  finding: createAssociationRemovalConfig<UpdateFindingInput>()(FINDING_ASSOCIATION_SECTIONS),
  identityHolder: createAssociationRemovalConfig<UpdateIdentityHolderInput>()(IDENTITY_HOLDER_ASSOCIATION_SECTIONS),
  review: createAssociationRemovalConfig<UpdateReviewInput>()(REVIEW_ASSOCIATION_SECTIONS),
  remediation: createAssociationRemovalConfig<UpdateRemediationInput>()(REMEDIATION_ASSOCIATION_SECTIONS),
  vulnerability: createAssociationRemovalConfig<UpdateVulnerabilityInput>()(VULNERABILITY_ASSOCIATION_SECTIONS),
  assets: createAssociationRemovalConfig<UpdateAssetInput>()(ASSET_ASSOCIATION_SECTIONS),
  reviews: createAssociationRemovalConfig<UpdateReviewInput>()(REVIEW_ASSOCIATION_SECTIONS),
  remediations: createAssociationRemovalConfig<UpdateRemediationInput>()(REMEDIATION_ASSOCIATION_SECTIONS),
} as const
