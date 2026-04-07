import WorkflowTemplatesPage from '@/components/pages/protected/workflows/workflow-templates-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Templates',
}

const Page: React.FC = () => <WorkflowTemplatesPage />

export default Page
