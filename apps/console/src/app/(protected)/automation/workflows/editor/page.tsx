import WorkflowEditorPage from '@/components/pages/protected/workflows/workflow-editor-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workflow Editor',
}

const Page: React.FC = () => <WorkflowEditorPage />

export default Page
