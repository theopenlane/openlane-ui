import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_GROUPS } from '@repo/codegen/query/group'
import { GET_ALL_INTERNAL_POLICIES } from '@repo/codegen/query/policy'
import { GET_ALL_PROCEDURES } from '@repo/codegen/query/procedure'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/programs'
import { GET_ALL_EVIDENCES } from '@repo/codegen/query/evidence'
import { TaskAllQueriesData, TaskObjectTypes } from '@repo/codegen/src/type-names'

export type AllQueriesDataKey = keyof TaskAllQueriesData

type TTaskObjectTypeConfig = {
  responseObjectKey: AllQueriesDataKey
  queryDocument: string
  inputName: string
  placeholder: string
  searchAttribute: string
  objectName: string
}

export const TASK_OBJECT_TASK_CONFIG: Record<TaskObjectTypes, TTaskObjectTypeConfig> = {
  [TaskObjectTypes.CONTROL]: {
    responseObjectKey: 'controls',
    inputName: 'controlIDs',
    placeholder: 'control',
    queryDocument: GET_ALL_CONTROLS,
    searchAttribute: 'refCode',
    objectName: 'refCode',
  },
  [TaskObjectTypes.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'control objective',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
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
  [TaskObjectTypes.INTERNAL_POLICY]: {
    responseObjectKey: 'internalPolicies',
    inputName: 'internalPolicyIDs',
    placeholder: 'internal policy',
    queryDocument: GET_ALL_INTERNAL_POLICIES,
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
    queryDocument: GET_ALL_PROGRAMS,
    searchAttribute: 'nameContainsFold',
    objectName: 'name',
  },
  [TaskObjectTypes.SUBCONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'subcontrols',
    queryDocument: GET_ALL_CONTROLS,
    searchAttribute: 'refCode',
    objectName: 'refCode',
  },
}

export const TaskStatusWithoutCompletedAndOpen = Object.fromEntries(Object.entries(TaskTaskStatus).filter(([key]) => key !== 'COMPLETED' && key !== 'OPEN')) as Omit<
  typeof TaskTaskStatus,
  'COMPLETED' | 'OPEN'
>
