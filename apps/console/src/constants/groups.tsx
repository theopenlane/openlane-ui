import { GET_ALL_CONTROLS } from '@repo/codegen/query/control'
import { GET_ALL_CONTROL_OBJECTIVES } from '@repo/codegen/query/control-objective'
import { GET_ALL_INTERNAL_POLICIES } from '@repo/codegen/query/policy'
import { GET_ALL_PROCEDURES } from '@repo/codegen/query/procedure'
import { GET_ALL_PROGRAMS } from '@repo/codegen/query/programs'
import { GET_ALL_RISKS } from '@repo/codegen/query/risks'
import { Program, Risk, Control, ControlObjective, InternalPolicy, Procedure, PageInfo, GroupPermissionWhereInput } from '@repo/codegen/src/schema'
import { Checkbox } from '@repo/ui/checkbox'
import { ColumnDef } from '@tanstack/table-core'

export type ObjectDataNode = Program | Risk | Control | ControlObjective | InternalPolicy | Procedure

export type TableDataItem = {
  id: string
  name: string
  checked: boolean
  togglePermission: (obj: TableDataItem) => void
  referenceFramework?: string
}

export enum ObjectTypes {
  CONTROL = 'Control',
  CONTROL_OBJECTIVE = 'Control Objective',
  INTERNAL_POLICY = 'Internal Policy',
  PROCEDURE = 'Procedure',
  PROGRAM = 'Program',
  RISK = 'Risk',
}

export const objectTypeInputToEnumMap: Record<string, ObjectTypes> = {
  Control: ObjectTypes.CONTROL,
  ControlObjective: ObjectTypes.CONTROL_OBJECTIVE,
  InternalPolicy: ObjectTypes.INTERNAL_POLICY,
  Procedure: ObjectTypes.PROCEDURE,
  Program: ObjectTypes.PROGRAM,
  Risk: ObjectTypes.RISK,
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

export type ObjectPermissionConfig = {
  roleOptions: string[]
  responseObjectKey: AllQueriesDataKey
  queryDocument: string
  objectName: string
  searchAttribute: string
  inputPlaceholder: string
  excludeViewersInFilter?: boolean
  extraTableColumns?: ColumnDef<TableDataItem>[]
}

export const OBJECT_TYPE_CONFIG: Record<ObjectTypes, ObjectPermissionConfig> = {
  [ObjectTypes.PROGRAM]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'programs',
    queryDocument: GET_ALL_PROGRAMS,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'program name',
  },
  [ObjectTypes.RISK]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'risks',
    queryDocument: GET_ALL_RISKS,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'risk name',
  },
  [ObjectTypes.CONTROL]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'controls',
    queryDocument: GET_ALL_CONTROLS,
    objectName: 'refCode',
    searchAttribute: 'refCodeContainsFold',
    inputPlaceholder: 'ref code',
    excludeViewersInFilter: true,
    extraTableColumns: [
      {
        header: 'Reference Framework',
        accessorKey: 'referenceFramework',
      },
    ],
  },
  [ObjectTypes.CONTROL_OBJECTIVE]: {
    roleOptions: ['View', 'Edit', 'Blocked'],
    responseObjectKey: 'controlObjectives',
    queryDocument: GET_ALL_CONTROL_OBJECTIVES,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'control objective name',
  },
  [ObjectTypes.INTERNAL_POLICY]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'internalPolicies',
    queryDocument: GET_ALL_INTERNAL_POLICIES,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'internal policy name',
    excludeViewersInFilter: true,
  },
  [ObjectTypes.PROCEDURE]: {
    roleOptions: ['Edit', 'Blocked'],
    responseObjectKey: 'procedures',
    queryDocument: GET_ALL_PROCEDURES,
    objectName: 'name',
    searchAttribute: 'nameContainsFold',
    inputPlaceholder: 'procedure name',
    excludeViewersInFilter: true,
  },
}

export const generateColumns = (selectedObject: ObjectTypes | null): ColumnDef<TableDataItem>[] => {
  const baseColumns: ColumnDef<TableDataItem>[] = [
    {
      header: '',
      accessorKey: 'checked',
      cell: ({ row }) => <Checkbox checked={row.original.checked} onCheckedChange={() => row.original.togglePermission(row.original || '')} />,
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
  ]

  const extraColumns = selectedObject ? OBJECT_TYPE_CONFIG[selectedObject]?.extraTableColumns || [] : []

  return [...baseColumns, ...extraColumns]
}

export const generateGroupsPermissionsWhere = ({
  debouncedSearchValue,
  selectedGroup,
  selectedObject,
}: {
  debouncedSearchValue: string
  selectedGroup: string | null
  selectedObject: ObjectTypes | null
}): { where: GroupPermissionWhereInput } => {
  if (!selectedObject || !selectedGroup) return { where: {} }

  const config = OBJECT_TYPE_CONFIG[selectedObject]
  const baseWhere = {
    [config.searchAttribute]: debouncedSearchValue,
  }

  const exclusionFilter = {
    not: {
      or: [
        { hasEditorsWith: [{ id: selectedGroup }] } as GroupPermissionWhereInput,
        { hasBlockedGroupsWith: [{ id: selectedGroup }] } as GroupPermissionWhereInput,
        ...(config.excludeViewersInFilter ? [] : [{ hasViewersWith: [{ id: selectedGroup }] } as GroupPermissionWhereInput]),
      ],
    },
  }

  return {
    where: {
      and: [baseWhere, exclusionFilter],
    },
  }
}
