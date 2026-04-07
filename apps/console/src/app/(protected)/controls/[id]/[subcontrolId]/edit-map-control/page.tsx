import EditMapControlPage from '@/components/pages/protected/controls/edit-map-control/edit-map-control-page'
import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Edit Control Mapping',
}

const Page = () => {
  return <EditMapControlPage />
}

export default Page
