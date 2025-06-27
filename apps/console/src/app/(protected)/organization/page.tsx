import React from 'react'
import { ExistingOrganizations } from '@/components/shared/organization/existing-organizations/existing-organizations'
import { CreateOrganizationForm } from '@/components/shared/organization/create-organization/create-organization'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organization',
}
const OrganizationLanding: React.FC = () => {
  return (
    <section>
      <ExistingOrganizations />
      <CreateOrganizationForm />
    </section>
  )
}

export default OrganizationLanding
