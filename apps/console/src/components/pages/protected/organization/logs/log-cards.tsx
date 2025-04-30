'use client'

import React from 'react'
import { Calendar, CircleUser, ListChecks } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { format } from 'date-fns'
import { Avatar } from '@/components/shared/avatar/avatar'
import { AuditLog, Task } from '@repo/codegen/src/schema.ts'

interface TProps {
  logs: AuditLog[]
  loading: boolean
}

const LogCards: React.FC<TProps> = ({ logs, loading }: TProps) => {
  if (loading) {
    return <p>Loading logs...</p>
  }

  return (
    <div className="mt-5 flex flex-wrap gap-7">
      {logs.length > 0 ? (
        logs.map((log) => {
          return (
            <Card key={log.id} className="w-full max-w-md cursor-pointer">
              <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b gap-2">
                <h3 className="font-semibold truncate">{log.operation}</h3>
              </div>
              <div className="py-3 px-4 pb-5">
                <div className="flex items-center space-x-2 p-1">
                  <ListChecks height={16} width={16} />
                  <p className="text-sm">text</p>
                </div>
                <div className="flex items-center space-x-2 p-1">
                  <CircleUser height={16} width={16} />
                  <div className="flex items-center space-x-1">
                    {/* <Avatar entity={task.assignee} />
                    <p>{fullName}</p>*/}
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-1">
                  <Calendar height={16} width={16} />
                  {/*<p className="pr-10 text-sm">{task?.due ? format(new Date(task.due as string), 'MMMM d, yyyy') : 'no due date'}</p>
                  <div className="flex items-center space-x-1">
                    {TaskStatusIconMapper[task.status!]}
                    <p>{task.status}</p>
                  </div>*/}
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

export default LogCards
