import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { EditTaskFormData } from '../hooks/use-form-schema'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'
import { Value } from 'platejs'
import { TaskQuery } from '@repo/codegen/src/schema'

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
    category: data?.category,
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

export const generateEvidenceFormData = (taskData: TaskQuery['task'] | undefined) => {
  if (!taskData) {
    return undefined
  }
  return {
    displayID: taskData!.displayID,
    tags: taskData!.tags ?? undefined,
    objectAssociations: {
      controlIDs: taskData?.controls?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      controlRefCodes: taskData?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || [],
      subcontrolIDs: taskData?.subcontrols?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      programIDs: taskData?.programs?.edges?.map((item) => item?.node?.id).filter((id): id is string => !!id) || [],
      programDisplayIDs: taskData?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || [],
      taskIDs: taskData.id ? [taskData.id] : [],
    },
    objectAssociationsDisplayIDs: [
      ...(taskData?.controls?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || []),
      ...(taskData?.subcontrols?.edges?.map((item) => item?.node?.refCode).filter((id): id is string => !!id) || []),
      ...(taskData?.programs?.edges?.map((item) => item?.node?.displayID).filter((id): id is string => !!id) || []),
      taskData.displayID,
    ],
  }
}
