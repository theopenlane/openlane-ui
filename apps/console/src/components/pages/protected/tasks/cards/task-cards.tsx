'use client'

import React from 'react'
import { Calendar, CircleUser, ListChecks } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { Avatar } from '@/components/shared/avatar/avatar'
import { TaskStatusIconMapper } from '../table/columns'
import { Task } from '@repo/codegen/src/schema.ts'
import { formatDate } from '@/utils/date'

type TTaskCardsProps = {
  tasks: Task[]
  isError: boolean
}

const TaskCards: React.FC<TTaskCardsProps> = (props: TTaskCardsProps) => {
  const { setSelectedTask } = useTaskStore()

  const handleRowClick = (task: Task) => {
    setSelectedTask(task.id ?? null)
  }

  if (props.isError) {
    return <p className="text-red-500">Error loading tasks</p>
  }

  return (
    <div className="mt-5 flex flex-wrap gap-7">
      {props.tasks.length > 0 ? (
        props.tasks.map((task) => {
          const firstName = task.assignee?.firstName
          const lastName = task.assignee?.lastName
          const fullName = !firstName && !lastName ? task.assignee?.displayName : `${firstName ?? ''} ${lastName ?? ''}`

          return (
            <Card key={task.id} className="w-full max-w-md cursor-pointer" onClick={() => handleRowClick(task)}>
              <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b gap-2">
                <h3 className="font-semibold truncate">{task.title}</h3>
              </div>
              <div className="py-3 px-4 pb-5">
                <div className="flex items-center space-x-2 p-1">
                  <ListChecks height={16} width={16} />
                  <p className="text-sm">
                    {task.title} - {task.category}
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
                    <p>{task.status}</p>
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
