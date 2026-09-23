import React from 'react'
import { type Metadata } from 'next'
import ReviewImportPage from '@/components/pages/protected/reviews/import/review-import-page'

export const metadata: Metadata = {
  title: 'Import Reviews',
}

const Page: React.FC = () => <ReviewImportPage />

export default Page
