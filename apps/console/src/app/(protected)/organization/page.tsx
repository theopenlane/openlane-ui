'use client'

import React from 'react'
import { CreateOrganizationForm } from '@/components/shared/organization/create-organization/create-organization'
import { ExistingOrganizations } from '@/components/shared/organization/existing-organizations/existing-organizations'

const OrganizationLanding: React.FC = () => {
  return (
    <section>
      <ExistingOrganizations />
      <CreateOrganizationForm />
    </section>
  )
}

export default OrganizationLanding
