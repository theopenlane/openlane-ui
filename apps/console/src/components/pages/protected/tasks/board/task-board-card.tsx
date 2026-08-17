'use client'

import React from 'react'
import { Calendar } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { Avatar } from '@/components/shared/avatar/avatar'
import { type TasksWithFilterNode } from '@/lib/graphql-hooks/task'
import { formatDate } from '@/utils/date'
import { TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type TTaskBoardCardProps = {
  task: TasksWithFilterNode
}

const TaskBoardCard = ({ task }: TTaskBoardCardProps) => {
  const { replace } = useSmartRouter()
  const subtitle = [task.title, task.taskKindName].filter(Boolean).join(' - ')

  const openTask = () => replace({ id: task.id })

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={task.title}
      onClick={openTask}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openTask()
        }
      }}
      className="w-full p-4 space-y-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2 min-w-0">
        <h3 className="font-semibold truncate">{task.title}</h3>
        {task.isTemplate && (
          <Badge variant="blue" className="shrink-0">
            Template
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      <div className="flex items-center gap-2 min-w-0">
        {task.assignee ? (
          <>
            <Avatar entity={task.assignee} variant="small" />
            <span className="text-sm truncate">{task.assignee.displayName}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar height={14} width={14} className="shrink-0 text-muted-foreground" />
          <span className="text-sm truncate">{formatDate(task.due)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-sm">
          {TaskStatusIconMapper[task.status]}
          <span>{getEnumLabel(task.status)}</span>
        </div>
      </div>
    </Card>
  )
}

export default TaskBoardCard
