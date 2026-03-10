import CreateControlForm from '@/components/pages/protected/controls/create-control/create-control-form'
import React from 'react'

import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clone Control',
}

const CreateControlPage = () => {
  return <CreateControlForm />
}

export default CreateControlPage
