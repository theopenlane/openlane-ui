import {
  GetAllControlObjectivesDocument,
  GetAllControlsDocument,
  GetAllInternalPoliciesDocument,
  GetAllNarrativesDocument,
  GetAllProceduresDocument,
  GetAllProgramsDocument,
  GetAllRisksDocument,
} from '@repo/codegen/src/schema'

export enum ObjectTypes {
  PROGRAM = 'Program',
  RISK = 'Risk',
  CONTROL = 'Control',
  CONTROL_OBJECTIVE = 'Control Objective',
  NARRATIVE = 'Narrative',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
}

export const OBJECT_TYPE_CONFIG: Record<ObjectTypes, { roleOptions: string[]; responseObjectKey: string; queryDocument: any }> = {
  [ObjectTypes.PROGRAM]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'programs',
    queryDocument: GetAllProgramsDocument,
  },
  [ObjectTypes.RISK]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'risks',
    queryDocument: GetAllRisksDocument,
  },
  [ObjectTypes.CONTROL]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controls',
    queryDocument: GetAllControlsDocument,
  },
  [ObjectTypes.CONTROL_OBJECTIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controlObjectives',
    queryDocument: GetAllControlObjectivesDocument,
  },
  [ObjectTypes.NARRATIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'narratives',
    queryDocument: GetAllNarrativesDocument,
  },
  [ObjectTypes.INTERNAL_POLICY]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'internalPolicies',
    queryDocument: GetAllInternalPoliciesDocument,
  },
  [ObjectTypes.PROCEDURE]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'procedures',
    queryDocument: GetAllProceduresDocument,
  },
}
