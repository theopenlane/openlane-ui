import React, { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import TasksPage from '@/components/pages/protected/tasks/table/tasks-page.tsx'
import TaskDetailsSheet from '@/components/pages/protected/tasks/create-task/sidebar/task-details-sheet'
import { TOrgMembers, useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Tasks',
}

const Page: React.FC = () => {
  // const { setSelectedTask, setOrgMembers } = useTaskStore()
  // const searchParams = useSearchParams()
  // const { data: session } = useSession()
  // const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  // const { setCrumbs } = React.useContext(BreadcrumbContext)

  // useEffect(() => {
  //   setCrumbs([
  //     { label: 'Home', href: '/dashboard' },
  //     { label: 'Tasks', href: '/tasks' },
  //   ])
  // }, [setCrumbs])

  // useEffect(() => {
  //   const taskId = searchParams.get('id')
  //   if (taskId) {
  //     setSelectedTask(taskId)
  //   }
  // }, [searchParams, setSelectedTask])

  // useEffect(() => {
  //   const members = membersData?.organization?.members?.edges?.map(
  //     (member) =>
  //       ({
  //         value: member?.node?.user?.id,
  //         label: `${member?.node?.user?.displayName}`,
  //         membershipId: member?.node?.user.id,
  //       }) as TOrgMembers,
  //   )
  //   setOrgMembers(members)
  // }, [membersData])

  return (
    <>
      <PageHeading heading="Tasks" />
      <TasksPage />
      <TaskDetailsSheet />
    </>
  )
}

export default Page
