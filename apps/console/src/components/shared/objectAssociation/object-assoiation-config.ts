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

import { Control, Subcontrol, ControlObjective, Program, TaskEdge, Evidence, Group, InternalPolicy, Procedure } from '@repo/codegen/src/schema'

export type AllObjectQueriesData = {
  controls?: {
    edges?: Array<{ node: Control }>
  }
  subcontrols?: {
    edges?: Array<{ node: Subcontrol }>
  }
  controlObjectives?: {
    edges?: Array<{ node: ControlObjective }>
  }
  programs?: {
    edges?: Array<{ node: Program }>
  }
  evidences?: {
    edges?: Array<{ node: Evidence }>
  }
  groups?: {
    edges?: Array<{ node: Group }>
  }
  internalPolicies?: {
    edges?: Array<{ node: InternalPolicy }>
  }
  procedures?: {
    edges?: Array<{ node: Procedure }>
  }
  tasks?: {
    edges?: Array<{ node: TaskEdge }>
  }
  risks?: {
    edges?: Array<{ node: TaskEdge }>
  }
}

export type AllObjectQueriesDataKey = keyof AllObjectQueriesData

export enum ObjectTypeObjects {
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
  queryDocument: any
  inputName: string
  placeholder: string
  searchAttribute: string
  objectName: string
}

export const OBJECT_QUERY_CONFIG: Record<ObjectTypeObjects, ObjectQueryConfig> = {
  [ObjectTypeObjects.CONTROL]: {
    responseObjectKey: 'controls',
    inputName: 'controlIDs',
    placeholder: 'control',
    queryDocument: GET_ALL_CONTROLS,
    searchAttribute: 'refCode',
    objectName: 'refCode',
  },
  [ObjectTypeObjects.SUB_CONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'subcontrol',
    queryDocument: GET_ALL_SUBCONTROLS,
    searchAttribute: 'refCode',
    objectName: 'refCode',
  },
  [ObjectTypeObjects.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'control objective',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [ObjectTypeObjects.PROGRAM]: {
    responseObjectKey: 'programs',
    inputName: 'programIDs',
    placeholder: 'program',
    queryDocument: GET_ALL_PROGRAMS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [ObjectTypeObjects.TASK]: {
    responseObjectKey: 'tasks',
    inputName: 'taskIDs',
    placeholder: 'task',
    queryDocument: TASKS_WITH_FILTER,
    searchAttribute: 'titleContainsFold',
    objectName: 'title',
  },
  [ObjectTypeObjects.EVIDENCE]: {
    responseObjectKey: 'evidences',
    inputName: 'evidenceIDs',
    placeholder: 'evidence',
    queryDocument: GET_ALL_EVIDENCES,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [ObjectTypeObjects.GROUP]: {
    responseObjectKey: 'groups',
    inputName: 'groupIDs',
    placeholder: 'group',
    queryDocument: GET_ALL_GROUPS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [ObjectTypeObjects.INTERNAL_POLICY]: {
    responseObjectKey: 'internalPolicies',
    inputName: 'internalPolicyIDs',
    placeholder: 'internal policy',
    queryDocument: GET_ALL_INTERNAL_POLICIES,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [ObjectTypeObjects.PROCEDURE]: {
    responseObjectKey: 'procedures',
    inputName: 'procedureIDs',
    placeholder: 'procedure',
    queryDocument: GET_ALL_PROCEDURES,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [ObjectTypeObjects.RISK]: {
    responseObjectKey: 'risks',
    inputName: 'riskIDs',
    placeholder: 'risk',
    queryDocument: GET_ALL_RISKS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
}
