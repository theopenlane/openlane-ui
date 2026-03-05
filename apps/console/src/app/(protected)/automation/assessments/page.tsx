import { QuestionnairesPageWrapper } from '@/components/pages/protected/questionnaire/questionnaires-page-wrapper'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Questionnaires',
}

const Page: React.FC = () => {
  return <QuestionnairesPageWrapper />
}

export default Page
