import WorkflowInboxPage from '@/components/pages/protected/workflows/workflow-inbox-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Inbox',
}

const Page: React.FC = () => <WorkflowInboxPage />

export default Page
