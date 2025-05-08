import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { QuestionnairesTable } from '@/components/pages/protected/questionnaire/table/questionnaire-table.tsx'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading eyebrow="Questionnaires" />

      <QuestionnairesTable />
    </>
  )
}

export default Page
