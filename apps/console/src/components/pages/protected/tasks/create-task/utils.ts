import { type CreateTaskFormData } from '../hooks/use-form-schema'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type GetTaskAssociationsQuery, type TaskQuery } from '@repo/codegen/src/schema'
import { buildAssociationIds, buildAssociationItems, type TAssociationItem } from '@/components/shared/object-association/association-items'
import { type AssociationSectionKey } from '@/components/shared/object-association/object-association-config'
import { getLinkedPrograms } from '@/components/shared/object-association/utils'
import { type TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData'

export type TTaskCopyMode = 'duplicate' | 'template'

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
