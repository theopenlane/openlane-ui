import { PageHeading } from '@repo/ui/page-heading'
import { QuestionnairesTable } from '@/components/pages/protected/questionnaire/table/questionnaire-table.tsx'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Questionnaires',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Questionnaires" />
      <QuestionnairesTable />
    </>
  )
}

export default Page
