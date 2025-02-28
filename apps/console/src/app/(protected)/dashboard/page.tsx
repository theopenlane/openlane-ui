'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { TaskWhereInput, UserWhereInput } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import { DefaultLanding, NewUserLanding } from '@/components/pages/protected/dashboard/dashboard'
import { CreateOrganizationForm } from '@/components/shared/organization/create-organization/create-organization'
import { useRouter } from 'next/navigation'
import { useGetDashboardData } from '@/lib/graphql-hooks/dashboard'

const DashboardLanding: React.FC = () => {
  const { data: session } = useSession()
  const { push } = useRouter()

  const assigneeId = session?.user.userId

  const userWhere: UserWhereInput = {
    id: assigneeId,
  }
  const whereFilter: TaskWhereInput = {
    hasAssigneeWith: [userWhere],
  }

  const { data, isLoading } = useGetDashboardData(whereFilter)

  const programsRes = { edges: data?.programs?.edges ?? [] }
  const taskRes = { edges: data?.tasks?.edges || [] }

  // if fetching data show loading
  if (isLoading || !data) {
    return <Loading />
  } else {
    // if no programs redirect to new user landing
    if (programsRes && programsRes?.edges?.length == 0) {
      return <NewUserLanding push={push} />
    }

    //  default landing page with programs and tasks
    return <DefaultLanding programs={programsRes} tasks={taskRes} push={push} />
  }
}

export default DashboardLanding
