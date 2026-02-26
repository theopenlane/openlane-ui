import WorkflowDefinitionDetailPage from '@/components/pages/protected/workflows/workflow-definition-detail-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Definition',
}

type PageProps = {
  params: { id: string }
}

const Page = ({ params }: PageProps) => <WorkflowDefinitionDetailPage workflowId={params.id} />

export default Page
