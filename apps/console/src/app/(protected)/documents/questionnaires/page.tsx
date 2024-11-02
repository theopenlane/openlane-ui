import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from "next/dynamic";
import { QuestionnairesTable } from '@/components/pages/protected/questionnaire/questionnaire-table';

const Page: React.FC = () => {
  return (
    <>
    <PageHeading eyebrow="Documents" heading="Questionnaires" />

    <QuestionnairesTable />
    </>
  )
}

export default Page
