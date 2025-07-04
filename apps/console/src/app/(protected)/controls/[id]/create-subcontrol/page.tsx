import CreateControlForm from '@/components/pages/protected/controls/create-control/create-control-form'
import React from 'react'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Subcontrol',
}

const CreateSubcontrolPage = () => {
  return <CreateControlForm />
}

export default CreateSubcontrolPage
