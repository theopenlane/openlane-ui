import MapControlPage from '@/components/pages/protected/controls/map-controls/map-control-page'
import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Map Control',
}

const Page = () => {
  return <MapControlPage />
}

export default Page
