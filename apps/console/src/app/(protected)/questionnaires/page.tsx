'use client'

import React, { useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { QuestionnairesTable } from '@/components/pages/protected/questionnaire/table/questionnaire-table.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const Page: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
    ])
  }, [setCrumbs])

  return (
    <>
      <PageHeading heading="Questionnaires" />

      <QuestionnairesTable />
    </>
  )
}

export default Page
