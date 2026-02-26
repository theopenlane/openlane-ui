import WorkflowWizardPage from '@/components/pages/protected/workflows/workflow-wizard-page'
import { Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'

export const metadata: Metadata = {
  title: 'Workflow Wizard',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Workflow Wizard" />
      <WorkflowWizardPage />
    </>
  )
}

export default Page
