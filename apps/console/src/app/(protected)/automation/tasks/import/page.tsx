import React from 'react'
import { type Metadata } from 'next'
import TaskImportPage from '@/components/pages/protected/tasks/import/task-import-page'

export const metadata: Metadata = {
  title: 'Import Tasks',
}

const Page: React.FC = () => <TaskImportPage />

export default Page
