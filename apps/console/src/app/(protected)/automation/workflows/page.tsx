import WorkflowsPage from '@/components/pages/protected/workflows/workflows-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflows',
}

const Page: React.FC = () => <WorkflowsPage />

export default Page
