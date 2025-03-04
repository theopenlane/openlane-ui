'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import TaskTable from '@/components/pages/protected/tasks/table/task-table'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Tasks" />
      <TaskTable />
      <TaskDetailsSheet />
    </>
  )
}

export default Page
