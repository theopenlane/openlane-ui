'use client'

import { useMemo } from 'react'
import { type GetTaskAssociationsQuery, type TaskQuery } from '@repo/codegen/src/schema'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type CreateTaskFormData } from './use-form-schema'
import { buildTaskAssociationItems, buildTaskCopyAssociations, buildTaskFormValues, type TTaskCopyMode } from '../create-task/utils'
import { type TAssociationItem } from '@/components/shared/object-association/association-items'

export type TTaskCopyPrefill = {
  initialValues: Partial<CreateTaskFormData> | undefined
  initialData: TObjectAssociationMap | undefined
  objectAssociationItems: TAssociationItem[]
}

export const useTaskCopyPrefill = (taskData: TaskQuery['task'] | undefined, associationData: GetTaskAssociationsQuery | undefined, mode: TTaskCopyMode | null): TTaskCopyPrefill => {
  const initialValues = useMemo(() => (mode ? buildTaskFormValues(taskData, mode) : undefined), [taskData, mode])
  const initialData = useMemo(() => (mode ? buildTaskCopyAssociations(associationData) : undefined), [associationData, mode])
  const objectAssociationItems = useMemo(() => (mode ? buildTaskAssociationItems(associationData) : []), [associationData, mode])

  return useMemo(() => ({ initialValues, initialData, objectAssociationItems }), [initialValues, initialData, objectAssociationItems])
}
