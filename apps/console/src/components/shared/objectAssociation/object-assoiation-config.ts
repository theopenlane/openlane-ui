import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_EVIDENCES } from '@repo/codegen/query/evidence'
import { GET_ALL_GROUPS } from '@repo/codegen/query/group'
import { GET_ALL_INTERNAL_POLICIES } from '@repo/codegen/query/policy'
import { GET_ALL_PROCEDURES } from '@repo/codegen/query/procedure'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/programs'
import { GET_ALL_RISKS } from '@repo/codegen/query/risks'
import { GET_ALL_SUBCONTROLS } from '@repo/codegen/query/subcontrol'
import { TASKS_WITH_FILTER } from '@repo/codegen/query/tasks'

import { Control, Subcontrol, ControlObjective, Program, TaskEdge, Evidence, Group, InternalPolicy, Procedure, PageInfo, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { useQueryClient } from '@tanstack/react-query'
import { RequestDocument } from 'graphql-request'

import {
  GetAllControlObjectivesQuery,
  GetAllControlsQuery,
  GetAllEvidencesQuery,
  GetAllGroupsQuery,
  GetAllInternalPoliciesQuery,
  GetAllProceduresWithDetailsQuery,
  GetAllProgramsQuery,
  GetAllRisksQuery,
  GetAllSubcontrolsQuery,
  TasksWithFilterQuery,
} from '@repo/codegen/src/schema'

export type QueryResponse =
  | GetAllControlsQuery
  | GetAllSubcontrolsQuery
  | GetAllControlObjectivesQuery
  | GetAllProgramsQuery
  | TasksWithFilterQuery
  | GetAllEvidencesQuery
  | GetAllGroupsQuery
  | GetAllInternalPoliciesQuery
  | GetAllProceduresWithDetailsQuery
  | GetAllRisksQuery

type QueryResponseMapKey = 'controls' | 'subcontrols' | 'controlObjectives' | 'programs' | 'tasks' | 'evidences' | 'groups' | 'internalPolicies' | 'procedures' | 'risks'

export type AllObjectQueriesData = {
  controls?: {
    edges?: Array<{ node: Control }>
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
    edges?: Array<{ node: TaskEdge }>
    pageInfo?: PageInfo
    totalCount?: number
  }
}

export type AllObjectQueriesDataKey = keyof AllObjectQueriesData

export enum ObjectTypeObjects {
  ASSET = 'Asset',
  CONTROL = 'Control',
  SUB_CONTROL = 'Subcontrol',
  CONTROL_OBJECTIVE = 'Control Objective',
  PROGRAM = 'Program',
  TASK = 'Task',
  EVIDENCE = 'Evidence',
  GROUP = 'Group',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
  RISK = 'Risk',
}

type ObjectQueryConfig = {
  responseObjectKey: AllObjectQueriesDataKey
  queryDocument: RequestDocument
  inputName: string
  placeholder: string
  objectName: string
}

export const OBJECT_QUERY_CONFIG: Record<ObjectTypeObjects, ObjectQueryConfig> = {
  [ObjectTypeObjects.CONTROL]: {
    responseObjectKey: 'controls',
    inputName: 'controlIDs',
    placeholder: 'Search controls',
    queryDocument: GET_ALL_CONTROLS,
    objectName: 'refCode',
  },
  [ObjectTypeObjects.SUB_CONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'Search subcontrols',
    queryDocument: GET_ALL_SUBCONTROLS,
    objectName: 'refCode',
  },
  [ObjectTypeObjects.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'Search control objectives',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
    objectName: 'name',
  },
  [ObjectTypeObjects.PROGRAM]: {
    responseObjectKey: 'programs',
    inputName: 'programIDs',
    placeholder: 'Search programs',
    queryDocument: GET_ALL_PROGRAMS,
    objectName: 'name',
  },
  [ObjectTypeObjects.TASK]: {
    responseObjectKey: 'tasks',
    inputName: 'taskIDs',
    placeholder: 'Search tasks',
    queryDocument: TASKS_WITH_FILTER,
    objectName: 'title',
  },
  [ObjectTypeObjects.EVIDENCE]: {
    responseObjectKey: 'evidences',
    inputName: 'evidenceIDs',
    placeholder: 'Search evidence',
    queryDocument: GET_ALL_EVIDENCES,
    objectName: 'name',
  },
  [ObjectTypeObjects.GROUP]: {
    responseObjectKey: 'groups',
    inputName: 'groupIDs',
    placeholder: 'Search groups',
    queryDocument: GET_ALL_GROUPS,
    objectName: 'name',
  },
  [ObjectTypeObjects.INTERNAL_POLICY]: {
    responseObjectKey: 'internalPolicies',
    inputName: 'internalPolicyIDs',
    placeholder: 'Search internal policies',
    queryDocument: GET_ALL_INTERNAL_POLICIES,
    objectName: 'name',
  },
  [ObjectTypeObjects.PROCEDURE]: {
    responseObjectKey: 'procedures',
    inputName: 'procedureIDs',
    placeholder: 'Search procedures',
    queryDocument: GET_ALL_PROCEDURES,
    objectName: 'name',
  },
  [ObjectTypeObjects.RISK]: {
    responseObjectKey: 'risks',
    inputName: 'riskIDs',
    placeholder: 'Search risks',
    queryDocument: GET_ALL_RISKS,
    objectName: 'name',
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
    case 'controls': {
      const typed = data as GetAllControlsQuery
      return { pageInfo: typed.controls.pageInfo, totalCount: typed.controls.totalCount }
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
    default:
      return {}
  }
}

export type TableRow = {
  id?: string
  name?: string
  description?: string
  inputName?: string
  refCode?: string
  details?: string
}

export function extractTableRows(objectKey: QueryResponseMapKey | undefined, data: QueryResponse | undefined, objectName?: string, inputName?: string): TableRow[] {
  if (!objectKey || !data || !objectName) return []

  switch (objectKey) {
    case 'controls': {
      const items = (data as GetAllControlsQuery).controls?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.refCode,
        description: item?.node?.description ?? '',
        inputName: inputName || '',
        refCode: item?.node?.refCode ?? '',
        details: '',
      }))
    }
    case 'subcontrols': {
      const items = (data as GetAllSubcontrolsQuery).subcontrols?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.refCode,
        description: item?.node?.description ?? '',
        inputName: inputName || '',
        refCode: item?.node?.refCode ?? '',
        details: '',
      }))
    }

    case 'controlObjectives': {
      const items = (data as GetAllControlObjectivesQuery).controlObjectives?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        description: item?.node?.desiredOutcome ?? '',
        inputName: inputName || '',
        refCode: '',
        details: item?.node?.category ?? '',
      }))
    }

    case 'programs': {
      const items = (data as GetAllProgramsQuery).programs?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        description: item?.node?.description ?? '',
        inputName: inputName || '',
        refCode: item?.node?.displayID ?? '',
        details: '',
      }))
    }

    case 'tasks': {
      const items = (data as TasksWithFilterQuery).tasks?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.title ?? '',
        description: item?.node?.details ?? '',
        inputName: inputName || '',
        refCode: item?.node?.displayID ?? '',
        details: '',
      }))
    }

    case 'evidences': {
      const items = (data as GetAllEvidencesQuery).evidences?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        description: item?.node?.description ?? '',
        inputName: inputName || '',
        refCode: item?.node?.displayID ?? '',
        details: '',
      }))
    }

    case 'groups': {
      const items = (data as GetAllGroupsQuery).groups?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        description: item?.node?.description ?? '',
        inputName: inputName || '',
        refCode: item?.node?.name ?? '',
        details: '',
      }))
    }

    case 'internalPolicies': {
      const items = (data as GetAllInternalPoliciesQuery).internalPolicies?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        description: item?.node?.summary ?? '',
        inputName: inputName || '',
        refCode: item?.node?.name ?? '',
        details: '',
      }))
    }

    case 'procedures': {
      const items = (data as GetAllProceduresWithDetailsQuery).procedures?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        description: '',
        inputName: inputName || '',
        refCode: '',
        details: '',
      }))
    }

    case 'risks': {
      const items = (data as GetAllRisksQuery).risks?.edges ?? []
      return items.map((item) => ({
        id: item?.node?.id || '',
        name: item?.node?.name ?? '',
        description: item?.node?.details ?? '',
        inputName: inputName || '',
        refCode: item?.node?.displayID ?? '',
        details: '',
      }))
    }

    default:
      return []
  }
}

export const generateWhere = (selectedObject: ObjectTypeObjects | null, searchValue: string, ownerID: string) => {
  if (!selectedObject) return {}

  const mandatoryFilterMap: Partial<Record<ObjectTypeObjects, Record<string, unknown>>> = {
    [ObjectTypeObjects.CONTROL]: { systemOwned: false },
    [ObjectTypeObjects.SUB_CONTROL]: { systemOwned: false },
    [ObjectTypeObjects.CONTROL_OBJECTIVE]: { ownerID: ownerID },
    [ObjectTypeObjects.PROGRAM]: { ownerID: ownerID },
    [ObjectTypeObjects.TASK]: { ownerID: ownerID },
    [ObjectTypeObjects.EVIDENCE]: { ownerID: ownerID },
    [ObjectTypeObjects.GROUP]: { ownerID: ownerID },
    [ObjectTypeObjects.INTERNAL_POLICY]: { systemOwned: false },
    [ObjectTypeObjects.PROCEDURE]: { systemOwned: false },
    [ObjectTypeObjects.RISK]: { ownerID: ownerID },
  }

  const searchAttributeMap: Partial<Record<ObjectTypeObjects, string>> = {
    [ObjectTypeObjects.CONTROL]: 'refCodeContainsFold',
    [ObjectTypeObjects.SUB_CONTROL]: 'refCodeContainsFold',
    [ObjectTypeObjects.CONTROL_OBJECTIVE]: 'nameContainsFold',
    [ObjectTypeObjects.PROGRAM]: 'nameContainsFold',
    [ObjectTypeObjects.TASK]: 'titleContainsFold',
    [ObjectTypeObjects.EVIDENCE]: 'nameContainsFold',
    [ObjectTypeObjects.GROUP]: 'nameContainsFold',
    [ObjectTypeObjects.INTERNAL_POLICY]: 'nameContainsFold',
    [ObjectTypeObjects.PROCEDURE]: 'nameContainsFold',
    [ObjectTypeObjects.RISK]: 'nameContainsFold',
  }

  const secondarySearchMap: Partial<Record<ObjectTypeObjects, string>> = {
    [ObjectTypeObjects.CONTROL]: 'descriptionContainsFold',
    [ObjectTypeObjects.SUB_CONTROL]: 'descriptionContainsFold',
    [ObjectTypeObjects.CONTROL_OBJECTIVE]: 'desiredOutcomeContainsFold',
    [ObjectTypeObjects.PROGRAM]: 'descriptionContainsFold',
    [ObjectTypeObjects.TASK]: 'detailsContainsFold',
    [ObjectTypeObjects.EVIDENCE]: 'descriptionContainsFold',
    [ObjectTypeObjects.INTERNAL_POLICY]: 'detailsContainsFold',
    [ObjectTypeObjects.RISK]: 'detailsContainsFold',
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

  const orFilters = secondaryAttribute ? [{ [searchAttribute!]: searchValue }, { [secondaryAttribute]: searchValue }] : [{ [searchAttribute!]: searchValue }]

  return {
    ...mandatoryWhere,
    ...defaultWhere,
    or: orFilters,
  }
}
