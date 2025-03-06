import {
  GetAllControlObjectivesDocument,
  GetAllControlsDocument,
  GetAllGroupsDocument,
  GetAllInternalPoliciesDocument,
  GetAllProceduresDocument,
  GetAllProgramsDocument,
  GetAllSubcontrolsDocument,
  TaskTaskStatus,
} from '@repo/codegen/src/schema'

export enum TaskTypes {
  EVIDENCE = 'Evidence',
  RISK_REVIEW = 'Risk Review',
  POLICY_REVIEW = 'Policy Review',
  OTHER = 'Other',
}

export enum TaskObjectTypes {
  CONTROL = 'Control',
  CONTROL_OBJECTIVE = 'Control Objective',
  EVIDENCE = 'Evidence',
  GROUP = 'Group',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
  PROGRAM = 'Program',
  SUBCONTROL = 'Subcontrol',
}

type TTaskObjectTypeConfig = {
  responseObjectKey: string
  queryDocument: any
  inputName: string
  placeholder: string
}

export const TASK_OBJECT_TASK_CONFIG: Record<TaskObjectTypes, TTaskObjectTypeConfig> = {
  [TaskObjectTypes.CONTROL]: {
    responseObjectKey: 'controls',
    inputName: 'controlIDs',
    placeholder: 'control',
    queryDocument: GetAllControlsDocument,
  },
  [TaskObjectTypes.CONTROL_OBJECTIVE]: {
    responseObjectKey: 'controlObjectives',
    inputName: 'controlObjectiveIDs',
    placeholder: 'control objective',
    queryDocument: GetAllControlObjectivesDocument,
  },
  [TaskObjectTypes.EVIDENCE]: {
    responseObjectKey: 'evidences',
    inputName: 'evidenceIDs',
    placeholder: 'evidence',
    queryDocument: GetAllControlObjectivesDocument,
  },
  [TaskObjectTypes.GROUP]: {
    responseObjectKey: 'groups',
    inputName: 'groupIDs',
    placeholder: 'group',
    queryDocument: GetAllGroupsDocument,
  },
  [TaskObjectTypes.INTERNAL_POLICY]: {
    responseObjectKey: 'internalPolicies',
    inputName: 'internalPolicyIDs',
    placeholder: 'internal policy',
    queryDocument: GetAllInternalPoliciesDocument,
  },
  [TaskObjectTypes.PROCEDURE]: {
    responseObjectKey: 'procedures',
    inputName: 'procedureIDs',
    placeholder: 'procedure',
    queryDocument: GetAllProceduresDocument,
  },
  [TaskObjectTypes.PROGRAM]: {
    responseObjectKey: 'programs',
    inputName: 'programIDs',
    placeholder: 'program',
    queryDocument: GetAllProgramsDocument,
  },
  [TaskObjectTypes.SUBCONTROL]: {
    responseObjectKey: 'subcontrols',
    inputName: 'subcontrolIDs',
    placeholder: 'subcontrols',
    queryDocument: GetAllSubcontrolsDocument,
  },
}

export const TaskStatusMapper: Record<TaskTaskStatus, string> = {
  [TaskTaskStatus.COMPLETED]: 'Completed',
  [TaskTaskStatus.IN_PROGRESS]: 'In progress',
  [TaskTaskStatus.IN_REVIEW]: 'In review',
  [TaskTaskStatus.OPEN]: 'Open',
  [TaskTaskStatus.WONT_DO]: "Won't do",
}
