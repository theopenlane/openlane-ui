import type usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type CreateTaskFormData, type EditTaskFormData } from '../hooks/use-form-schema'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'
import { type Value } from 'platejs'
import { type GetTaskAssociationsQuery, type TaskQuery } from '@repo/codegen/src/schema'
import { buildAssociationIds, buildAssociationItems, type TAssociationItem } from '@/components/shared/object-association/association-items'
import { type AssociationSectionKey } from '@/components/shared/object-association/object-association-config'
import { getLinkedPrograms } from '@/components/shared/object-association/utils'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData'

export type TTaskCopyMode = 'duplicate' | 'template'

const generateAssociationPayload = (original: TObjectAssociationMap, updated: TObjectAssociationMap) => {
  const payload: Record<string, string[]> = {}

  const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)])

  allKeys.forEach((key) => {
    const prev = original[key] ?? []
    const next = updated[key] ?? []

    const add = next.filter((id) => !prev.includes(id))
    const remove = prev.filter((id) => !next.includes(id))

    if (add.length > 0) payload[`add${capitalizeFirstLetter(key)}`] = add
    if (remove.length > 0) payload[`remove${capitalizeFirstLetter(key)}`] = remove
  })

  return payload
}

export const buildTaskPayload = async (
  data: EditTaskFormData,
  plateEditorHelper: ReturnType<typeof usePlateEditor>,
  initialAssociations: TObjectAssociationMap,
  updatedAssociations: TObjectAssociationMap,
) => {
  const details = data?.details ? await plateEditorHelper.convertToHtml(data.details as Value) : undefined
  return {
    taskKindName: data?.taskKindName,
    due: data?.due ? new Date(data.due).toISOString() : undefined,
    title: data?.title,
    details,
    assigneeID: data?.assigneeID,
    status: data?.status,
    clearAssignee: !data?.assigneeID,
    clearDue: !data?.due,
    tags: data.tags,
    isTemplate: data.isTemplate,
    ...generateAssociationPayload(initialAssociations, updatedAssociations),
  }
}

export const TASK_ASSOCIATION_SECTIONS = ['controls', 'subcontrols', 'programs', 'procedures', 'policies', 'controlObjectives', 'risks', 'groups'] as const satisfies readonly AssociationSectionKey[]

export const buildTaskCopyAssociations = (associationData: GetTaskAssociationsQuery | undefined): TObjectAssociationMap => buildAssociationIds(TASK_ASSOCIATION_SECTIONS, associationData?.task)

export const buildTaskAssociations = (associationData: GetTaskAssociationsQuery | undefined, taskData: TaskQuery['task'] | undefined): TObjectAssociationMap => ({
  ...buildTaskCopyAssociations(associationData),
  taskIDs: (taskData?.tasks ?? []).flatMap((item) => (item?.id ? [item.id] : [])),
})

export const buildTaskAssociationItems = (associationData: GetTaskAssociationsQuery | undefined): TAssociationItem[] => buildAssociationItems(TASK_ASSOCIATION_SECTIONS, associationData?.task)

export const buildTaskFormValues = (taskData: TaskQuery['task'] | undefined, mode: TTaskCopyMode): Partial<CreateTaskFormData> | undefined => {
  if (!taskData) {
    return undefined
  }

  const isDuplicate = mode === 'duplicate'

  return {
    title: isDuplicate ? `Copy of ${taskData.title ?? ''}` : (taskData.title ?? ''),
    taskKindName: taskData.taskKindName ?? undefined,
    details: taskData.details ?? undefined,
    assigneeID: taskData.assignee?.id,
    tags: taskData.tags?.filter((tag): tag is string => !!tag) ?? [],
    due: isDuplicate && taskData.due ? new Date(String(taskData.due)) : undefined,
    isTemplate: isDuplicate && !!taskData.isTemplate,
  }
}

export const generateEvidenceFormData = (taskData: TaskQuery['task'] | undefined, associationData: GetTaskAssociationsQuery | undefined): TFormEvidenceData | undefined => {
  if (!taskData) {
    return undefined
  }

  const linkedPrograms = getLinkedPrograms(associationData?.task?.programs?.edges)

  return {
    displayID: taskData.displayID,
    tags: taskData.tags ?? undefined,
    controlRefCodes: associationData?.task?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
    subcontrolRefCodes: associationData?.task?.subcontrols?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
    linkedPrograms,
    referenceFramework: Object.fromEntries(associationData?.task?.controls?.edges?.map((item) => [item?.node?.id ?? 'default', item?.node?.referenceFramework ?? '']) || []),
    subcontrolReferenceFramework: Object.fromEntries(associationData?.task?.subcontrols?.edges?.map((item) => [item?.node?.id ?? 'default', item?.node?.referenceFramework ?? '']) || []),
    objectAssociations: {
      controlIDs: associationData?.task?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      subcontrolIDs: associationData?.task?.subcontrols?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      programIDs: linkedPrograms.map(({ id }) => id),
      taskIDs: taskData.id ? [taskData.id] : [],
    },
  }
}
