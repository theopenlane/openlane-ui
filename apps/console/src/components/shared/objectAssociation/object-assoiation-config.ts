import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/programs'
import { GET_ALL_SUBCONTROLS } from '@repo/codegen/query/subcontrol'
import { TASKS_WITH_FILTER } from '@repo/codegen/query/tasks'

import { Control, Subcontrol, ControlObjective, Program, TaskEdge } from '@repo/codegen/src/schema'

/**
 * Defines the data shape for all evidence object types, keyed by their respective property.
 */
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
  tasks?: {
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
}
