import GroupsPage from '@/components/pages/protected/groups/groups-page'
import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Groups',
}

const Page: React.FC = () => <GroupsPage />

export default Page
