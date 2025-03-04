import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/programs'
import { GET_ALL_SUBCONTROLS } from '@repo/codegen/query/subcontrol'
import { TASKS_WITH_FILTER } from '@repo/codegen/query/tasks'

export enum EvidenceObjects {
  CONTROL = 'Control',
  SUB_CONTROL = 'Subcontrol',
  CONTROL_OBJECTIVE = 'Control Objective',
  PROGRAM = 'Program',
  TASK = 'Task',
}

type TEvidenceObjectConfig = {
  responseObjectKey: string
  queryDocument: any
  inputName: string
  placeholder: string
}

export const EVIDENCE_OBJECT_CONFIG: Record<EvidenceObjects, TEvidenceObjectConfig> = {
  [EvidenceObjects.CONTROL]: {
    responseObjectKey: 'controls',
    inputName: 'programIDs',
    placeholder: 'control',
    queryDocument: GET_ALL_CONTROLS,
  },
  [EvidenceObjects.SUB_CONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'subcontrol',
    queryDocument: GET_ALL_SUBCONTROLS,
  },
  [EvidenceObjects.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'control objective',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
  },
  [EvidenceObjects.PROGRAM]: {
    responseObjectKey: 'programs',
    inputName: 'programIDs',
    placeholder: 'program',
    queryDocument: GET_ALL_PROGRAMS,
  },
  [EvidenceObjects.TASK]: {
    responseObjectKey: 'tasks',
    inputName: 'taskIDs',
    placeholder: 'task',
    queryDocument: TASKS_WITH_FILTER,
  },
}
