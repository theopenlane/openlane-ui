import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { EditTaskFormData } from '../hooks/use-form-schema'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'
import { Value } from 'platejs'
import { GetTaskAssociationsQuery, TaskQuery } from '@repo/codegen/src/schema'

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
    due: data?.due ? data.due.toISOString() : undefined,
    title: data?.title,
    details,
    assigneeID: data?.assigneeID,
    status: data?.status,
    clearAssignee: !data?.assigneeID,
    clearDue: !data?.due,
    tags: data.tags,
    ...generateAssociationPayload(initialAssociations, updatedAssociations),
  }
}

export const generateEvidenceFormData = (taskData: TaskQuery['task'] | undefined, associationData: GetTaskAssociationsQuery | undefined) => {
  if (!taskData) {
    return undefined
  }

  return {
    displayID: taskData!.displayID,
    tags: taskData!.tags ?? undefined,
    controlRefCodes: associationData?.task?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
    subcontrolRefCodes: associationData?.task?.subcontrols?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
    programDisplayIDs: associationData?.task?.programs?.edges?.map((item) => item?.node?.name).filter((id): id is string => !!id) || [],
    referenceFramework: Object.fromEntries(associationData?.task?.controls?.edges?.map((item) => [item?.node?.id ?? 'default', item?.node?.referenceFramework ?? '']) || []),
    subcontrolReferenceFramework: Object.fromEntries(associationData?.task?.subcontrols?.edges?.map((item) => [item?.node?.id ?? 'default', item?.node?.referenceFramework ?? '']) || []),
    objectAssociations: {
      controlIDs: associationData?.task?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      subcontrolIDs: associationData?.task?.subcontrols?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      programIDs: associationData?.task?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      taskIDs: taskData.id ? [taskData.id] : [],
    },
    objectAssociationsDisplayIDs: [
      ...(associationData?.task?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || []),
      ...(associationData?.task?.subcontrols?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || []),
      ...(associationData?.task?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || []),
      taskData.displayID,
    ],
  }
}
