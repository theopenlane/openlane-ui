import React from 'react'
import { Metadata } from 'next'
import CustomDataPage from '@/components/pages/protected/custom-data/custom-data-page.tsx'

export const metadata: Metadata = {
  title: 'Billing',
}
const Page: React.FC = () => <CustomDataPage />

export default Page
