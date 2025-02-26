import { GetAllControlObjectivesDocument, GetAllControlsDocument, GetAllProgramsDocument, GetAllSubcontrolsDocument, TasksWithFilterDocument } from '@repo/codegen/src/schema'

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
    queryDocument: GetAllControlsDocument,
  },
  [EvidenceObjects.SUB_CONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'subcontrol',
    queryDocument: GetAllSubcontrolsDocument,
  },
  [EvidenceObjects.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'control objective',
    queryDocument: GetAllControlObjectivesDocument,
  },
  [EvidenceObjects.PROGRAM]: {
    responseObjectKey: 'programs',
    inputName: 'programIDs',
    placeholder: 'program',
    queryDocument: GetAllProgramsDocument,
  },
  [EvidenceObjects.TASK]: {
    responseObjectKey: 'tasks',
    inputName: 'taskIDs',
    placeholder: 'task',
    queryDocument: TasksWithFilterDocument,
  },
}
