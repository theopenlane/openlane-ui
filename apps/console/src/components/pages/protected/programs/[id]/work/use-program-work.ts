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
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { controlOwnedByUsersWhere, groupContainsUsersWhere } from '@/lib/control-where'
import { edgeNodes } from '@/utils/graphql-edges'
import {
  useProgramWorkControlCount,
  useProgramWorkControls,
  useProgramWorkEvidenceCount,
  useProgramWorkEvidences,
  useProgramWorkInternalPolicies,
  useProgramWorkInternalPolicyCount,
  useProgramWorkProcedureCount,
  useProgramWorkProcedures,
  useProgramWorkTaskCount,
  useProgramWorkTasks,
} from '@/lib/graphql-hooks/program-work'
import { getOverdueBefore, type TProgramWorkFilters } from './program-work-filters'
import {
  toControlWorkItem,
  toEvidenceWorkItem,
  toPolicyWorkItem,
  toProcedureWorkItem,
  toTaskWorkItem,
  WORK_OBJECT_TYPE_NAME,
  WORK_OBJECT_TYPE_ORDER,
  type TWorkItem,
  type TWorkObjectType,
} from './work-item'
import { CONTROL_WORK_STATUS, EVIDENCE_WORK_STATUS, POLICY_WORK_STATUS, PROCEDURE_WORK_STATUS, sourceStatusesFor, TASK_WORK_STATUS, WORK_STATUS_ORDER } from './work-status'

export const PROGRAM_WORK_FETCH_LIMIT = 100

const TASK_ORDER_BY = [{ field: TaskOrderField.created_at, direction: OrderDirection.ASC }]
const CONTROL_ORDER_BY = [{ field: ControlOrderField.created_at, direction: OrderDirection.ASC }]
const EVIDENCE_ORDER_BY = [{ field: EvidenceOrderField.created_at, direction: OrderDirection.ASC }]
const POLICY_ORDER_BY = [{ field: InternalPolicyOrderField.created_at, direction: OrderDirection.ASC }]
const PROCEDURE_ORDER_BY = [{ field: ProcedureOrderField.created_at, direction: OrderDirection.ASC }]

export type TProgramWorkData = {
  items: TWorkItem[]
  countsByType: Record<TWorkObjectType, number>
  totalCount: number
  availableObjectTypes: TWorkObjectType[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isTruncated: boolean
  filteredCount: number
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

  const availableObjectTypes = useMemo(() => WORK_OBJECT_TYPE_ORDER.filter((objectType) => hasObjectType(WORK_OBJECT_TYPE_NAME[objectType])), [hasObjectType])

  const taskStatuses = useMemo(() => sourceStatusesFor(TASK_WORK_STATUS, workStatusIn), [workStatusIn])
  const controlStatuses = useMemo(() => sourceStatusesFor(CONTROL_WORK_STATUS, workStatusIn), [workStatusIn])
  const evidenceStatuses = useMemo(() => sourceStatusesFor(EVIDENCE_WORK_STATUS, workStatusIn), [workStatusIn])
  const policyStatuses = useMemo(() => sourceStatusesFor(POLICY_WORK_STATUS, workStatusIn), [workStatusIn])
  const procedureStatuses = useMemo(() => sourceStatusesFor(PROCEDURE_WORK_STATUS, workStatusIn), [workStatusIn])

  const isTypeCounted = (objectType: TWorkObjectType, statuses: readonly string[]) => !!programId && availableObjectTypes.includes(objectType) && statuses.length > 0

  const isTypeSelected = (objectType: TWorkObjectType) => objectTypeIn.length === 0 || objectTypeIn.includes(objectType)

  const isTypeListed = (objectType: TWorkObjectType, isCounted: boolean) => isCounted && isTypeSelected(objectType) && (!overdueOnly || objectType === ObjectAssociationNodeEnum.TASK)

  const tasksCounted = isTypeCounted(ObjectAssociationNodeEnum.TASK, taskStatuses)
  const controlsCounted = isTypeCounted(ObjectAssociationNodeEnum.CONTROL, controlStatuses)
  const evidencesCounted = isTypeCounted(ObjectAssociationNodeEnum.EVIDENCE, evidenceStatuses)
  const policiesCounted = isTypeCounted(ObjectAssociationNodeEnum.POLICY, policyStatuses)
  const proceduresCounted = isTypeCounted(ObjectAssociationNodeEnum.PROCEDURE, procedureStatuses)

  const tasksEnabled = isTypeListed(ObjectAssociationNodeEnum.TASK, tasksCounted)
  const controlsEnabled = isTypeListed(ObjectAssociationNodeEnum.CONTROL, controlsCounted)
  const evidencesEnabled = isTypeListed(ObjectAssociationNodeEnum.EVIDENCE, evidencesCounted)
  const policiesEnabled = isTypeListed(ObjectAssociationNodeEnum.POLICY, policiesCounted)
  const proceduresEnabled = isTypeListed(ObjectAssociationNodeEnum.PROCEDURE, proceduresCounted)

  const programWhere = { hasProgramsWith: [{ id: programId }] }

  const taskCountWhere: TaskWhereInput = { ...programWhere, statusIn: taskStatuses }
  const controlCountWhere: ControlWhereInput = { ...programWhere, statusIn: controlStatuses }
  const evidenceCountWhere: EvidenceWhereInput = { ...programWhere, statusIn: evidenceStatuses }
  const policyCountWhere: InternalPolicyWhereInput = { ...programWhere, statusIn: policyStatuses }
  const procedureCountWhere: ProcedureWhereInput = { ...programWhere, statusIn: procedureStatuses }

  const taskWhere: TaskWhereInput = {
    ...taskCountWhere,
    ...(ownerIDIn.length > 0 ? { assigneeIDIn: ownerIDIn } : {}),
    ...(overdueOnly ? { dueLT: overdueBefore } : {}),
    ...(search ? { titleContainsFold: search } : {}),
  }

  const controlWhere: ControlWhereInput = {
    ...controlCountWhere,
    ...(ownerIDIn.length > 0 ? controlOwnedByUsersWhere(ownerIDIn) : {}),
    ...(search ? { or: [{ refCodeContainsFold: search }, { titleContainsFold: search }] } : {}),
  }

  const evidenceWhere: EvidenceWhereInput = {
    ...evidenceCountWhere,
    ...(ownerIDIn.length > 0 ? { hasControlsWith: [controlOwnedByUsersWhere(ownerIDIn)] } : {}),
    ...(search ? { nameContainsFold: search } : {}),
  }

  const policyWhere: InternalPolicyWhereInput = {
    ...policyCountWhere,
    ...(ownerIDIn.length > 0 ? { hasApproverWith: [groupContainsUsersWhere(ownerIDIn)] } : {}),
    ...(search ? { nameContainsFold: search } : {}),
  }

  const procedureWhere: ProcedureWhereInput = {
    ...procedureCountWhere,
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

  const taskCountQuery = useProgramWorkTaskCount({ variables: { where: taskCountWhere }, enabled: tasksCounted })
  const controlCountQuery = useProgramWorkControlCount({ variables: { where: controlCountWhere }, enabled: controlsCounted })
  const evidenceCountQuery = useProgramWorkEvidenceCount({ variables: { where: evidenceCountWhere }, enabled: evidencesCounted })
  const policyCountQuery = useProgramWorkInternalPolicyCount({ variables: { where: policyCountWhere }, enabled: policiesCounted })
  const procedureCountQuery = useProgramWorkProcedureCount({ variables: { where: procedureCountWhere }, enabled: proceduresCounted })

  const queries = [tasksQuery, controlsQuery, evidencesQuery, policiesQuery, proceduresQuery, taskCountQuery, controlCountQuery, evidenceCountQuery, policyCountQuery, procedureCountQuery]

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

  const countsByType = useMemo<Record<TWorkObjectType, number>>(
    () => ({
      [ObjectAssociationNodeEnum.TASK]: taskCountQuery.data?.tasks.totalCount ?? 0,
      [ObjectAssociationNodeEnum.CONTROL]: controlCountQuery.data?.controls.totalCount ?? 0,
      [ObjectAssociationNodeEnum.EVIDENCE]: evidenceCountQuery.data?.evidences.totalCount ?? 0,
      [ObjectAssociationNodeEnum.POLICY]: policyCountQuery.data?.internalPolicies.totalCount ?? 0,
      [ObjectAssociationNodeEnum.PROCEDURE]: procedureCountQuery.data?.procedures.totalCount ?? 0,
    }),
    [taskCountQuery.data, controlCountQuery.data, evidenceCountQuery.data, policyCountQuery.data, procedureCountQuery.data],
  )

  const totalCount = WORK_OBJECT_TYPE_ORDER.reduce((sum, objectType) => sum + countsByType[objectType], 0)

  const filteredCount =
    (taskData?.tasks.totalCount ?? 0) +
    (controlData?.controls.totalCount ?? 0) +
    (evidenceData?.evidences.totalCount ?? 0) +
    (policyData?.internalPolicies.totalCount ?? 0) +
    (procedureData?.procedures.totalCount ?? 0)

  return {
    items,
    countsByType,
    totalCount,
    availableObjectTypes,
    isLoading: queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    isTruncated: filteredCount > items.length,
    filteredCount,
  }
}
