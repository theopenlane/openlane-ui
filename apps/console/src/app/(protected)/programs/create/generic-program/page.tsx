import React from 'react'
import { type Metadata } from 'next'
import GenericProgram from '@/components/pages/protected/programs/create/generic-program/generic-program'

export const metadata: Metadata = {
  title: 'Create Program',
}

const Page: React.FC = () => <GenericProgram />

export default Page
