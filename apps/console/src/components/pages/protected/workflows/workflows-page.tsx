'use client'

import React, { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { useWorkflowDefinitionsWithFilter } from '@/lib/graphql-hooks/workflow-definition'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import WorkflowDefinitionsTablePage from './table/page'
import WorkflowWizardPage from './workflow-wizard-page'
import { breadcrumbs } from './table/table-config'

const WorkflowsPage: React.FC = () => {
  const { setCrumbs } = React.use(BreadcrumbContext)

  const { data, isLoading } = useWorkflowDefinitionsWithFilter({
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
  })

  const totalCount = data?.workflowDefinitions?.totalCount
  const isEmpty = !isLoading && totalCount === 0

  useEffect(() => {
    if (isEmpty) {
      setCrumbs(breadcrumbs)
    }
  }, [isEmpty, setCrumbs])

  if (isLoading) return null

  if (isEmpty) {
    return (
      <>
        <PageHeading heading="Create your first workflow" />
        <WorkflowWizardPage embedded />
      </>
    )
  }

  return <WorkflowDefinitionsTablePage />
}

export default WorkflowsPage
