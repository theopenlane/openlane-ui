import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_NARRATIVES } from '@repo/codegen/query/narrative'
import { GET_ALL_INTERNAL_POLICIES } from '@repo/codegen/query/policy'
import { GET_ALL_PROCEDURES } from '@repo/codegen/query/procedure'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/programs'
import { GET_ALL_RISKS } from '@repo/codegen/query/risks'

export enum ObjectTypes {
  PROGRAM = 'Program',
  RISK = 'Risk',
  CONTROL = 'Control',
  CONTROL_OBJECTIVE = 'Control Objective',
  NARRATIVE = 'Narrative',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
}

import { Program, Risk, Control, ControlObjective, NarrativeEdge, InternalPolicy, Procedure } from '@repo/codegen/src/schema'

/**
 * Our "data" shape for all object types, keyed by their respective property.
 */
export type AllQueriesData = {
  programs?: {
    edges?: Array<{ node: Program }>
  }
  risks?: {
    edges?: Array<{ node: Risk }>
  }
  controls?: {
    edges?: Array<{ node: Control }>
  }
  controlObjectives?: {
    edges?: Array<{ node: ControlObjective }>
  }
  narratives?: {
    edges?: Array<{ node: NarrativeEdge }>
  }
  internalPolicies?: {
    edges?: Array<{ node: InternalPolicy }>
  }
  procedures?: {
    edges?: Array<{ node: Procedure }>
  }
}

export type AllQueriesDataKey = keyof AllQueriesData

export const OBJECT_TYPE_CONFIG: Record<
  ObjectTypes,
  {
    roleOptions: string[]
    responseObjectKey: AllQueriesDataKey
    queryDocument: any
  }
> = {
  [ObjectTypes.PROGRAM]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'programs',
    queryDocument: GET_ALL_PROGRAMS,
  },
  [ObjectTypes.RISK]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'risks',
    queryDocument: GET_ALL_RISKS,
  },
  [ObjectTypes.CONTROL]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controls',
    queryDocument: GET_ALL_CONTROLS,
  },
  [ObjectTypes.CONTROL_OBJECTIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controlObjectives',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
  },
  [ObjectTypes.NARRATIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'narratives',
    queryDocument: GET_ALL_NARRATIVES,
  },
  [ObjectTypes.INTERNAL_POLICY]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'internalPolicies',
    queryDocument: GET_ALL_INTERNAL_POLICIES,
  },
  [ObjectTypes.PROCEDURE]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'procedures',
    queryDocument: GET_ALL_PROCEDURES,
  },
}
