import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from 'next/dynamic'
import { QuestionnairesTable } from '@/components/pages/protected/questionnaire/questionnaire-table'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Questionnaires" heading="View All" />

      <QuestionnairesTable />
    </>
  )
}

export default Page
