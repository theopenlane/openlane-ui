'use client'

import { useMemo } from 'react'
import { type GetTaskAssociationsQuery, type TaskQuery } from '@repo/codegen/src/schema'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type CreateTaskFormData } from './use-form-schema'
import { buildTaskAssociationDisplayIDs, buildTaskCopyAssociations, buildTaskFormValues, type TTaskCopyMode } from '../create-task/utils'

export type TTaskCopyPrefill = {
  initialValues: Partial<CreateTaskFormData> | undefined
  initialData: TObjectAssociationMap | undefined
  objectAssociationsDisplayIDs: string[] | undefined
}

export const useTaskCopyPrefill = (taskData: TaskQuery['task'] | undefined, associationData: GetTaskAssociationsQuery | undefined, mode: TTaskCopyMode | null): TTaskCopyPrefill => {
  const initialValues = useMemo(() => (mode ? buildTaskFormValues(taskData, mode) : undefined), [taskData, mode])
  const initialData = useMemo(() => (mode ? buildTaskCopyAssociations(associationData) : undefined), [associationData, mode])
  const objectAssociationsDisplayIDs = useMemo(() => (mode ? buildTaskAssociationDisplayIDs(associationData) : undefined), [associationData, mode])

  return useMemo(() => ({ initialValues, initialData, objectAssociationsDisplayIDs }), [initialValues, initialData, objectAssociationsDisplayIDs])
}
