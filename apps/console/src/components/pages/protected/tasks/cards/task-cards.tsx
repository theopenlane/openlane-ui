'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Calendar, CircleUser, ListChecks } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { TTableDataResponse } from '@/components/pages/protected/tasks/table/types/TTableDataResponse'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { TaskStatusIconMapper } from '@/components/pages/protected/tasks/util/columns'
import { format } from 'date-fns'

interface TProps {
  tasks: TTableDataResponse[]
  loading: boolean
}

const TaskCards: React.FC<TProps> = (props: TProps) => {
  const { setSelectedTask } = useTaskStore()

  const handleRowClick = (task: TTableDataResponse) => {
    setSelectedTask(task.id ?? null)
  }

  if (props.loading) {
    return <p>Loading tasks...</p>
  }

  return (
    <div className="mt-5 flex flex-wrap gap-7">
      {props.tasks.length > 0 ? (
        props.tasks.map((task) => {
          const image = task.assigner?.avatarFile?.presignedURL || task.assigner?.avatarRemoteURL
          const firstName = task.assigner?.firstName
          const lastName = task.assigner?.lastName
          const fullName = !firstName && !lastName ? task.assigner?.displayName : `${firstName ?? ''} ${lastName ?? ''}`
          const initials = fullName
            ? fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
            : 'N/A'

          return (
            <Card key={task.id} className="w-full max-w-md cursor-pointer" onClick={() => handleRowClick(task)}>
              <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b gap-2">
                <h3 className="font-semibold truncate">{task.title}</h3>
              </div>
              <div className="py-3 px-4 pb-5">
                <div className="flex items-center space-x-2 p-1">
                  <ListChecks height={16} width={16} />
                  <p className="text-sm">
                    {task.displayID} - {task.category}
                  </p>
                </div>
                <div className="flex items-center space-x-2 p-1">
                  <CircleUser height={16} width={16} />
                  <div className="flex items-center space-x-1">
                    <Avatar>
                      {image && <AvatarImage src={image} />}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <p>{fullName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-1">
                  <Calendar height={16} width={16} />
                  <p className="pr-10 text-sm">{format(new Date(task.due as string), 'd MMM, yyyy')}</p>
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
