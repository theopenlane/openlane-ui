'use client'

import { useCallback, useMemo } from 'react'
import { OrderDirection, TaskOrderField, TaskTaskStatus } from '@repo/codegen/src/schema'
import { useTasksWithFilter, useUpdateTask } from '@/lib/graphql-hooks/task'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { SuggestedTaskSource, type SuggestedTask, type SuggestedTaskMetadata, type SuggestedTaskSourceValue } from '@/lib/suggested-tasks/types'

const TASK_KIND_ENUM_WHERE = { objectType: 'task', field: 'kind' }
const SUGGESTED_TASK_SOURCES: SuggestedTaskSourceValue[] = [SuggestedTaskSource.ONBOARDING, SuggestedTaskSource.RECOMMENDATIONS]
const SUGGESTED_TASK_ORDER_BY = [{ field: TaskOrderField.priority, direction: OrderDirection.DESC }]

export type RecommendationsFeedFilter = {
  source?: SuggestedTaskSourceValue
}

export type RecommendationsFeed = {
  suggestions: SuggestedTask[]
  isLoading: boolean
  error: Error | null
  dismissSuggestion: (suggestionId: string) => void
}

export const useRecommendationsFeed = ({ source }: RecommendationsFeedFilter = {}): RecommendationsFeed => {
  const where = useMemo(() => ({ isSuggested: true, ...(source ? { source } : { sourceIn: SUGGESTED_TASK_SOURCES }) }), [source])

  const { tasks, isLoading: isTasksLoading, error } = useTasksWithFilter({ where, orderBy: SUGGESTED_TASK_ORDER_BY })
  const { enumOptions: taskKindOptions } = useGetCustomTypeEnums({ where: TASK_KIND_ENUM_WHERE })
  const { mutate: updateTask } = useUpdateTask()

  const suggestions = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        details: task.details ?? '',
        status: task.status,
        taskKind: {
          name: task.taskKindName ?? '',
          color: taskKindOptions.find((option) => option.value === task.taskKindName)?.color ?? '',
        },
        source: (task.source ?? SuggestedTaskSource.RECOMMENDATIONS) as SuggestedTaskSourceValue,
        metadata: (task.metadata ?? {}) as SuggestedTaskMetadata,
      })),
    [tasks, taskKindOptions],
  )

  const dismissSuggestion = useCallback(
    (suggestionId: string) => {
      updateTask({ updateTaskId: suggestionId, input: { status: TaskTaskStatus.WONT_DO } })
    },
    [updateTask],
  )

  return { suggestions, isLoading: isTasksLoading, error: (error as Error) ?? null, dismissSuggestion }
}
