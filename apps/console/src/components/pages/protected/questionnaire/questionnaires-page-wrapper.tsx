'use client'
import { PageHeading } from '@repo/ui/page-heading'
import { QuestionnairesTable } from '@/components/pages/protected/questionnaire/table/questionnaire-table'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'

export const QuestionnairesPageWrapper = () => {
  const router = useRouter()

  return (
    <>
      <PageHeading
        heading="Questionnaires"
        actions={
          <Button variant="primary" size="md" onClick={() => router.push('/templates')}>
            View Templates
          </Button>
        }
      />
      <QuestionnairesTable />
    </>
  )
}
