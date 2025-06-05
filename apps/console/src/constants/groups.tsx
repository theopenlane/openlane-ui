import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_NARRATIVES } from '@repo/codegen/query/narrative'
import { GET_ALL_INTERNAL_POLICIES } from '@repo/codegen/query/policy'
import { GET_ALL_PROCEDURES } from '@repo/codegen/query/procedure'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/programs'
import { GET_ALL_RISKS } from '@repo/codegen/query/risks'
import { Program, Risk, Control, ControlObjective, NarrativeEdge, InternalPolicy, Procedure, PageInfo } from '@repo/codegen/src/schema'
import { Checkbox } from '@repo/ui/checkbox'
import { ColumnDef } from '@tanstack/table-core'

export type TableDataItem = {
  id: string
  name: string
  checked: boolean
  togglePermission: (id: string) => void
  referenceFramework?: string
}

export enum ObjectTypes {
  CONTROL = 'Controls',
  CONTROL_OBJECTIVE = 'Control Objective',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
  PROGRAM = 'Program',
  RISK = 'Risk',
  // NARRATIVE = 'Narrative',
}

export const objectTypeInputToEnumMap: Record<string, ObjectTypes> = {
  Program: ObjectTypes.PROGRAM,
  Risk: ObjectTypes.RISK,
  Control: ObjectTypes.CONTROL,
  ControlObjective: ObjectTypes.CONTROL_OBJECTIVE,
  // Narrative: ObjectTypes.NARRATIVE,
  InternalPolicy: ObjectTypes.INTERNAL_POLICY,
  Procedure: ObjectTypes.PROCEDURE,
}

/**
 * Our "data" shape for all object types, keyed by their respective property.
 */
export type AllQueriesData = {
  programs?: {
    edges?: Array<{ node: Program }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  risks?: {
    edges?: Array<{ node: Risk }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controls?: {
    edges?: Array<{ node: Control }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  controlObjectives?: {
    edges?: Array<{ node: ControlObjective }>
    pageInfo?: PageInfo
    totalCount?: number
  }
  // narratives?: {
  //   edges?: Array<{ node: NarrativeEdge }>
  // }
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
    responseObjectKey: 'risks',
    queryDocument: GET_ALL_RISKS,
  },
  [ObjectTypes.CONTROL_OBJECTIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controlObjectives',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
  },
  // [ObjectTypes.NARRATIVE]: {
  //   roleOptions: ['View', 'Edit', 'Blocked'],
  //   responseObjectKey: 'narratives',
  //   queryDocument: GET_ALL_NARRATIVES,
  // },
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

export const generateColumns = (selectedObject: ObjectTypes | null): ColumnDef<TableDataItem>[] => {
  const baseColumns: ColumnDef<TableDataItem>[] = [
    {
      header: '',
      accessorKey: 'checked',
      cell: ({ row }) => <Checkbox checked={row.original.checked} onCheckedChange={() => row.original.togglePermission(row.original.id || '')} />,
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
  ]

  const conditionalColumns: ColumnDef<TableDataItem>[] = []

  if (selectedObject === ObjectTypes.CONTROL) {
    conditionalColumns.push({
      header: 'Reference Framework',
      accessorKey: 'referenceFramework',
    })
  }

  if (selectedObject === ObjectTypes.PROGRAM) {
    conditionalColumns.unshift({
      header: 'Display ID',
      accessorKey: 'displayID',
    })
  }

  return [...baseColumns, ...conditionalColumns]
}
