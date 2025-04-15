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
  const { setSelectedTask, setOrgMembers } = useTaskStore()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })

  useEffect(() => {
    const taskId = searchParams.get('taskId')
    if (taskId) {
      setSelectedTask(taskId)
    }
  }, [searchParams, setSelectedTask])

  useEffect(() => {
    const members = membersData?.organization?.members?.edges?.map(
      (member) =>
        ({
          value: member?.node?.user?.id,
          label: `${member?.node?.user?.firstName} ${member?.node?.user?.lastName}`,
          membershipId: member?.node?.user.id,
        }) as TOrgMembers,
    )
    setOrgMembers(members)
  }, [membersData])

  return (
    <>
      <PageHeading heading="Tasks" />
      <TaskTable />
      <TaskDetailsSheet />
    </>
  )
}

export default Page
