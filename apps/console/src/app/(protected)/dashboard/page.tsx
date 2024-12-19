'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { TaskWhereInput, useGetDashboardDataQuery, UserWhereInput } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import { defaultLanding, newUserLanding } from '@/components/pages/protected/dashboard/dashboard'
import { CreateOrganizationForm } from '@/components/shared/organization/create-organization/create-organization'
import { useRouter } from 'next/navigation'

const DashboardLanding: React.FC = () => {
  const { data: session } = useSession()
  const { push } = useRouter()

  const assigneeId = session?.user.userId

  const userWhere: UserWhereInput = {
    id: assigneeId,
  }
  const whereFilter: TaskWhereInput = {
    hasAssigneeWith: [userWhere]
  }

  const [{ data: dashboardData, fetching }] = useGetDashboardDataQuery({ variables: { where: whereFilter }, pause: !session })


  const programsRes = { edges: dashboardData?.programs?.edges ?? [] }
  const taskRes = { edges: dashboardData?.tasks?.edges || [] }

  // if fetching data show loading
  if (fetching || !dashboardData) {
    return <Loading />
  } else {
    // if no organizations other than their personal org, show create organization form,
    if (dashboardData?.organizations?.edges?.length == 1) {
      return (
        <section>
          <CreateOrganizationForm />
        </section>
      )
    }

    // if no programs redirect to new user landing
    if (programsRes && programsRes?.edges?.length == 0) {
      return newUserLanding({ push: push })
    }

    //  default landing page with programs and tasks
    return defaultLanding({ programs: programsRes, tasks: taskRes, push: push })
  }
}

export default DashboardLanding
