'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import TaskTable from '@/components/pages/protected/tasks/table/task-table'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'

const Page: React.FC = () => {
  const { selectedTask } = useTaskStore()

  return (
    <>
      <PageHeading heading="Tasks" />
      <TaskTable />
      {selectedTask && <TaskDetailsSheet />}
    </>
  )
}

export default Page
