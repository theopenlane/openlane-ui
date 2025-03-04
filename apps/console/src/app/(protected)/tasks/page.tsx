import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import TaskTable from '@/components/pages/protected/tasks/table/task-table'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Tasks" />
      <TaskTable />
    </>
  )
}

export default Page
