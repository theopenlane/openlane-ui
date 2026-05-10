import type { Metadata } from 'next/types'
import { QueryBuilderPage } from '@/components/pages/protected/developers/query-builder-page'

export const metadata: Metadata = { title: 'Reports | Custom Report' }

export default function Page() {
  return <QueryBuilderPage />
}
