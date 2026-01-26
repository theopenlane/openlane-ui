'use client'

import React from 'react'
import { Calendar, CircleUser, ListChecks } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Task } from '@repo/codegen/src/schema.ts'
import { formatDate } from '@/utils/date'
import { TaskStatusMapper } from '../util/task'
import { TaskStatusIconMapper } from '@/components/shared/enum-mapper/task-enum'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type TTaskCardsProps = {
  tasks: Task[]
  isError: boolean
}

const TaskCards: React.FC<TTaskCardsProps> = (props: TTaskCardsProps) => {
  const { replace } = useSmartRouter()
  if (props.isError) {
    return <p className="text-red-500">Error loading tasks</p>
  }
  return (
    <div className="flex flex-wrap gap-7">
      {props.tasks.length > 0 ? (
        props.tasks.map((task) => {
          const fullName = task.assignee?.displayName

          return (
            <Card
              key={task.id}
              className="w-full max-w-md cursor-pointer"
              onClick={() => {
                replace({ id: task.id })
              }}
            >
              <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b gap-2">
                <h3 className="font-semibold truncate">{task.title}</h3>
              </div>
              <div className="py-3 px-4 pb-5">
                <div className="flex items-center space-x-2 p-1">
                  <ListChecks height={16} width={16} />
                  <p className="text-sm font-bold">
                    {task.title} - {task.taskKindName}
                  </p>
                </div>
                <div className="flex items-center space-x-2 p-1">
                  <CircleUser height={16} width={16} />
                  <div className="flex items-center space-x-1">
                    <Avatar entity={task.assignee} />
                    <p>{fullName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-1">
                  <Calendar height={16} width={16} />
                  <p className="pr-10 text-sm">{formatDate(task.due)}</p>
                  <div className="flex items-center space-x-1">
                    {TaskStatusIconMapper[task.status!]}
                    <p>{TaskStatusMapper[task.status!]}</p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })
      ) : (
        <p className="">No tasks available.</p>
      )}
    </div>
  )
}

export default TaskCards
