import WorkflowInstancesPage from '@/components/pages/protected/workflows/workflow-instances-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Instances',
}

const Page: React.FC = () => <WorkflowInstancesPage />

export default Page
