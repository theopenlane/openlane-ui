import WorkflowWizardPage from '@/components/pages/protected/workflows/workflow-wizard-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Wizard',
}

const Page: React.FC = () => <WorkflowWizardPage />

export default Page
