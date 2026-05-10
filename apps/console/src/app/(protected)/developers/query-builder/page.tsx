import type { Metadata } from 'next/types'
import { QueryBuilderPage } from '@/components/pages/protected/developers/query-builder-page'

export const metadata: Metadata = { title: 'Developers | Query Builder' }

export default function Page() {
  return <QueryBuilderPage />
}
