'use client'
import React, { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import TaskTable from '@/components/pages/protected/tasks/table/task-table'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { useSearchParams } from 'next/navigation'

const Page: React.FC = () => {
  const { selectedTask, setSelectedTask } = useTaskStore()
  const searchParams = useSearchParams()

  useEffect(() => {
    const taskId = searchParams.get('taskId')
    if (taskId) {
      setSelectedTask(taskId)
    }
  }, [searchParams, setSelectedTask])

  return (
    <>
      <PageHeading heading="Tasks" />
      <TaskTable />
      {selectedTask && <TaskDetailsSheet />}
    </>
  )
}

export default Page
