'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import InfiniteScroll from '@theopenlane/ui/infinite-scroll'
import { Card } from '@theopenlane/ui/cardpanel'
import { cn } from '@theopenlane/ui/lib/utils'
import { type TaskTaskStatus, type TaskWhereInput } from '@repo/codegen/src/schema'
import { CARD_DEFAULT_PAGINATION } from '@/constants/pagination'
import { useTasksWithFilterInfinite } from '@/lib/graphql-hooks/task'
import { TaskStatusDotMapper } from '@/components/shared/enum-mapper/task-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { useCanEditTasks } from '@/lib/authz/use-can-edit-tasks'
import DraggableTaskBoardCard from '@/components/pages/protected/tasks/board/draggable-task-board-card'
import { TASK_COLUMN_DROP_TYPE, type TaskColumnDropData, canMoveTaskTo, readDraggedTask } from '@/components/pages/protected/tasks/board/task-drag-data'
import { getColumnQueryArgs, type TaskBoardOrderBy } from '@/components/pages/protected/tasks/board/task-board-column-query'

const COLUMN_PADDING = 'px-3'

type TTaskBoardColumnProps = {
  status: TaskTaskStatus
  whereFilter: TaskWhereInput
  orderByFilter: TaskBoardOrderBy
  onHasTasksChange?: (status: TaskTaskStatus, hasTasks: boolean) => void
}

const TaskBoardColumn = ({ status, whereFilter, orderByFilter, onHasTasksChange }: TTaskBoardColumnProps) => {
  const columnArgs = useMemo(() => getColumnQueryArgs(whereFilter, orderByFilter, status), [whereFilter, orderByFilter, status])
  const { setNodeRef, isOver, active } = useDroppable({ id: status, data: { type: TASK_COLUMN_DROP_TYPE, status } satisfies TaskColumnDropData })
  const draggedTask = readDraggedTask(active)
  const isDropTarget = isOver && !!draggedTask && canMoveTaskTo(draggedTask, status)

  const { tasks, isError, isLoading, paginationMeta, fetchNextPage } = useTasksWithFilterInfinite(columnArgs)

  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks])
  const canEditTask = useCanEditTasks(taskIds)

  const handleLoadMore = useCallback(() => {
    fetchNextPage({ cancelRefetch: false })
  }, [fetchNextPage])

  const hasTasks = !isError && paginationMeta.totalCount > 0

  useEffect(() => {
    onHasTasksChange?.(status, hasTasks)
  }, [status, hasTasks, onHasTasksChange])

  return (
    <Card ref={setNodeRef} className={cn('flex flex-col flex-1 min-w-[300px] overflow-hidden bg-secondary h-[calc(100vh-236px)]', isDropTarget && 'ring-2 ring-primary')}>
      <div className={cn('flex items-center gap-2 py-3 border-b shrink-0', COLUMN_PADDING)}>
        <span className={cn('h-2 w-2 rounded-full shrink-0', TaskStatusDotMapper[status])} />
        <span className="font-medium truncate">{getEnumLabel(status)}</span>
        {!isLoading && !isError && <span className="rounded-md bg-card px-1.5 py-0.5 text-xs text-muted-foreground shrink-0">{paginationMeta.totalCount}</span>}
      </div>
      <div className={cn('flex flex-col gap-3 py-3 flex-1 overflow-y-auto', COLUMN_PADDING)}>
        {isError && <p className="text-sm text-destructive">Error loading tasks</p>}
        {!isError && isLoading && <SkeletonRows count={3} height={128} />}
        {!isError && !isLoading && tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks</p>}
        {!isError && !isLoading && tasks.length > 0 && (
          <InfiniteScroll pagination={CARD_DEFAULT_PAGINATION} onPaginationChange={handleLoadMore} paginationMeta={paginationMeta} pageSize={CARD_DEFAULT_PAGINATION.pageSize}>
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <DraggableTaskBoardCard key={task.id} task={task} disabled={!canEditTask(task.id)} />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </Card>
  )
}

export default TaskBoardColumn
