import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import TasksPage from '@/components/pages/protected/tasks/table/tasks-page.tsx'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Tasks',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Tasks" />
      <TasksPage />
      <TaskDetailsSheet />
    </>
  )
}

export default Page
