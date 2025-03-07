'use client'
import React, { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import TaskTable from '@/components/pages/protected/tasks/table/task-table'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { TOrgMembers, useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'

const Page: React.FC = () => {
  const { selectedTask, setSelectedTask, setOrgMembers } = useTaskStore()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { data: membersData } = useGetSingleOrganizationMembers(session?.user.activeOrganizationId)

  useEffect(() => {
    const taskId = searchParams.get('taskId')
    if (taskId) {
      setSelectedTask(taskId)
    }
  }, [searchParams, setSelectedTask])

  useEffect(() => {
    const members = membersData?.organization?.members
      ?.filter((member) => member.user.id != session?.user.userId)
      .map(
        (member) =>
          ({
            value: member.user.id,
            label: `${member.user.firstName} ${member.user.lastName}`,
            membershipId: member.id,
          }) as TOrgMembers,
      )
    setOrgMembers(members)
  }, [membersData])

  return (
    <>
      <PageHeading heading="Tasks" />
      <TaskTable />
      {selectedTask && <TaskDetailsSheet />}
    </>
  )
}

export default Page
