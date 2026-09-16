'use client'

import { useMemo } from 'react'
import {
  ControlOrderField,
  EvidenceOrderField,
  InternalPolicyOrderField,
  OrderDirection,
  ProcedureOrderField,
  TaskOrderField,
  type ControlWhereInput,
  type EvidenceWhereInput,
  type InternalPolicyWhereInput,
  type ProcedureWhereInput,
  type TaskWhereInput,
} from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { controlOwnedByUsersWhere, groupContainsUsersWhere } from '@/lib/control-where'
import { edgeNodes } from '@/utils/graphql-edges'
import { useProgramWorkControls, useProgramWorkEvidences, useProgramWorkInternalPolicies, useProgramWorkProcedures, useProgramWorkTasks } from '@/lib/graphql-hooks/program-work'
import { getOverdueBefore, type TProgramWorkFilters } from './program-work-filters'
import { toControlWorkItem, toEvidenceWorkItem, toPolicyWorkItem, toProcedureWorkItem, toTaskWorkItem, WorkObjectType, WORK_OBJECT_TYPE_ORDER, type TWorkItem } from './work-item'
import { CONTROL_WORK_STATUS, EVIDENCE_WORK_STATUS, POLICY_WORK_STATUS, PROCEDURE_WORK_STATUS, sourceStatusesFor, TASK_WORK_STATUS, WORK_STATUS_ORDER } from './work-status'

export const PROGRAM_WORK_FETCH_LIMIT = 100

const TASK_ORDER_BY = [{ field: TaskOrderField.created_at, direction: OrderDirection.ASC }]
const CONTROL_ORDER_BY = [{ field: ControlOrderField.created_at, direction: OrderDirection.ASC }]
const EVIDENCE_ORDER_BY = [{ field: EvidenceOrderField.created_at, direction: OrderDirection.ASC }]
const POLICY_ORDER_BY = [{ field: InternalPolicyOrderField.created_at, direction: OrderDirection.ASC }]
const PROCEDURE_ORDER_BY = [{ field: ProcedureOrderField.created_at, direction: OrderDirection.ASC }]

export const WORK_OBJECT_TYPE_MODULE: Record<WorkObjectType, ObjectTypes> = {
  [WorkObjectType.TASK]: ObjectTypes.TASK,
  [WorkObjectType.CONTROL]: ObjectTypes.CONTROL,
  [WorkObjectType.EVIDENCE]: ObjectTypes.EVIDENCE,
  [WorkObjectType.POLICY]: ObjectTypes.INTERNAL_POLICY,
  [WorkObjectType.PROCEDURE]: ObjectTypes.PROCEDURE,
}

export type TProgramWorkData = {
  items: TWorkItem[]
  countsByType: Record<WorkObjectType, number>
  totalCount: number
  availableObjectTypes: WorkObjectType[]
  countedObjectTypes: WorkObjectType[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isTruncated: boolean
}

type TUseProgramWorkArgs = {
  programId: string
  filters: TProgramWorkFilters
  search: string
}

export const sortWorkItems = (items: TWorkItem[]): TWorkItem[] =>
  [...items].sort((a, b) => {
    const statusDelta = WORK_STATUS_ORDER.indexOf(a.workStatus) - WORK_STATUS_ORDER.indexOf(b.workStatus)
    if (statusDelta !== 0) return statusDelta

    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1

    const aCreated = a.createdAt ?? ''
    const bCreated = b.createdAt ?? ''
    if (aCreated !== bCreated) return aCreated < bCreated ? -1 : 1

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })

export const useProgramWork = ({ programId, filters, search }: TUseProgramWorkArgs): TProgramWorkData => {
  const { workStatusIn, objectTypeIn, ownerIDIn, overdueOnly } = filters
  const { hasObjectType } = useModuleAccess()
  const overdueBefore = useMemo(() => getOverdueBefore(), [])

  const availableObjectTypes = useMemo(() => WORK_OBJECT_TYPE_ORDER.filter((objectType) => hasObjectType(WORK_OBJECT_TYPE_MODULE[objectType])), [hasObjectType])

  const taskStatuses = useMemo(() => sourceStatusesFor(TASK_WORK_STATUS, workStatusIn), [workStatusIn])
  const controlStatuses = useMemo(() => sourceStatusesFor(CONTROL_WORK_STATUS, workStatusIn), [workStatusIn])
  const evidenceStatuses = useMemo(() => sourceStatusesFor(EVIDENCE_WORK_STATUS, workStatusIn), [workStatusIn])
  const policyStatuses = useMemo(() => sourceStatusesFor(POLICY_WORK_STATUS, workStatusIn), [workStatusIn])
  const procedureStatuses = useMemo(() => sourceStatusesFor(PROCEDURE_WORK_STATUS, workStatusIn), [workStatusIn])

  const isTypeEnabled = (objectType: WorkObjectType, statusCount: number) =>
    !!programId && availableObjectTypes.includes(objectType) && objectTypeIn.includes(objectType) && statusCount > 0 && (!overdueOnly || objectType === WorkObjectType.TASK)

  const tasksEnabled = isTypeEnabled(WorkObjectType.TASK, taskStatuses.length)
  const controlsEnabled = isTypeEnabled(WorkObjectType.CONTROL, controlStatuses.length)
  const evidencesEnabled = isTypeEnabled(WorkObjectType.EVIDENCE, evidenceStatuses.length)
  const policiesEnabled = isTypeEnabled(WorkObjectType.POLICY, policyStatuses.length)
  const proceduresEnabled = isTypeEnabled(WorkObjectType.PROCEDURE, procedureStatuses.length)

  const taskWhere: TaskWhereInput = {
    hasProgramsWith: [{ id: programId }],
    statusIn: taskStatuses,
    ...(ownerIDIn.length > 0 ? { assigneeIDIn: ownerIDIn } : {}),
    ...(overdueOnly ? { dueLT: overdueBefore } : {}),
    ...(search ? { titleContainsFold: search } : {}),
  }

  const controlWhere: ControlWhereInput = {
    hasProgramsWith: [{ id: programId }],
    statusIn: controlStatuses,
    ...(ownerIDIn.length > 0 ? controlOwnedByUsersWhere(ownerIDIn) : {}),
    ...(search ? { or: [{ refCodeContainsFold: search }, { titleContainsFold: search }] } : {}),
  }

  const evidenceWhere: EvidenceWhereInput = {
    hasProgramsWith: [{ id: programId }],
    statusIn: evidenceStatuses,
    ...(ownerIDIn.length > 0 ? { hasControlsWith: [controlOwnedByUsersWhere(ownerIDIn)] } : {}),
    ...(search ? { nameContainsFold: search } : {}),
  }

  const policyWhere: InternalPolicyWhereInput = {
    hasProgramsWith: [{ id: programId }],
    statusIn: policyStatuses,
    ...(ownerIDIn.length > 0 ? { hasApproverWith: [groupContainsUsersWhere(ownerIDIn)] } : {}),
    ...(search ? { nameContainsFold: search } : {}),
  }

  const procedureWhere: ProcedureWhereInput = {
    hasProgramsWith: [{ id: programId }],
    statusIn: procedureStatuses,
    ...(ownerIDIn.length > 0 ? { hasApproverWith: [groupContainsUsersWhere(ownerIDIn)] } : {}),
    ...(search ? { nameContainsFold: search } : {}),
  }

  const tasksQuery = useProgramWorkTasks({
    variables: { where: taskWhere, first: PROGRAM_WORK_FETCH_LIMIT, orderBy: TASK_ORDER_BY },
    enabled: tasksEnabled,
  })
  const controlsQuery = useProgramWorkControls({
    variables: { where: controlWhere, first: PROGRAM_WORK_FETCH_LIMIT, orderBy: CONTROL_ORDER_BY },
    enabled: controlsEnabled,
  })
  const evidencesQuery = useProgramWorkEvidences({
    variables: { where: evidenceWhere, first: PROGRAM_WORK_FETCH_LIMIT, orderBy: EVIDENCE_ORDER_BY },
    enabled: evidencesEnabled,
  })
  const policiesQuery = useProgramWorkInternalPolicies({
    variables: { where: policyWhere, first: PROGRAM_WORK_FETCH_LIMIT, orderBy: POLICY_ORDER_BY },
    enabled: policiesEnabled,
  })
  const proceduresQuery = useProgramWorkProcedures({
    variables: { where: procedureWhere, first: PROGRAM_WORK_FETCH_LIMIT, orderBy: PROCEDURE_ORDER_BY },
    enabled: proceduresEnabled,
  })

  const queries = [tasksQuery, controlsQuery, evidencesQuery, policiesQuery, proceduresQuery]

  const taskData = tasksEnabled ? tasksQuery.data : undefined
  const controlData = controlsEnabled ? controlsQuery.data : undefined
  const evidenceData = evidencesEnabled ? evidencesQuery.data : undefined
  const policyData = policiesEnabled ? policiesQuery.data : undefined
  const procedureData = proceduresEnabled ? proceduresQuery.data : undefined

  const taskItems = useMemo(() => edgeNodes(taskData?.tasks).map((node) => toTaskWorkItem(node, new Date(overdueBefore).getTime())), [taskData, overdueBefore])
  const controlItems = useMemo(() => edgeNodes(controlData?.controls).map(toControlWorkItem), [controlData])
  const evidenceItems = useMemo(() => edgeNodes(evidenceData?.evidences).map(toEvidenceWorkItem), [evidenceData])
  const policyItems = useMemo(() => edgeNodes(policyData?.internalPolicies).map(toPolicyWorkItem), [policyData])
  const procedureItems = useMemo(() => edgeNodes(procedureData?.procedures).map(toProcedureWorkItem), [procedureData])

  const items = useMemo(
    () => sortWorkItems([...taskItems, ...controlItems, ...evidenceItems, ...policyItems, ...procedureItems]),
    [taskItems, controlItems, evidenceItems, policyItems, procedureItems],
  )

  const countsByType = useMemo<Record<WorkObjectType, number>>(
    () => ({
      [WorkObjectType.TASK]: taskData?.tasks.totalCount ?? 0,
      [WorkObjectType.CONTROL]: controlData?.controls.totalCount ?? 0,
      [WorkObjectType.EVIDENCE]: evidenceData?.evidences.totalCount ?? 0,
      [WorkObjectType.POLICY]: policyData?.internalPolicies.totalCount ?? 0,
      [WorkObjectType.PROCEDURE]: procedureData?.procedures.totalCount ?? 0,
    }),
    [taskData, controlData, evidenceData, policyData, procedureData],
  )

  const countedObjectTypes = useMemo(
    () =>
      WORK_OBJECT_TYPE_ORDER.filter(
        (objectType) =>
          ({
            [WorkObjectType.TASK]: tasksEnabled,
            [WorkObjectType.CONTROL]: controlsEnabled,
            [WorkObjectType.EVIDENCE]: evidencesEnabled,
            [WorkObjectType.POLICY]: policiesEnabled,
            [WorkObjectType.PROCEDURE]: proceduresEnabled,
          })[objectType],
      ),
    [tasksEnabled, controlsEnabled, evidencesEnabled, policiesEnabled, proceduresEnabled],
  )

  const totalCount = WORK_OBJECT_TYPE_ORDER.reduce((sum, objectType) => sum + countsByType[objectType], 0)

  return {
    items,
    countsByType,
    totalCount,
    availableObjectTypes,
    countedObjectTypes,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    isTruncated: totalCount > items.length,
  }
}
