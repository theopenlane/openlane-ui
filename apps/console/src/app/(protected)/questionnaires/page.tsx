import { QuestionnairesPageWrapper } from '@/components/pages/protected/questionnaire/questionnaires-page-wrapper'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Questionnaires',
}

const Page: React.FC = () => {
  return <QuestionnairesPageWrapper />
}

export default Page
