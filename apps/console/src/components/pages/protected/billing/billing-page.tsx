'use client'
import React, { Suspense, useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import PricingPlan from '@/components/pages/protected/organization/billing/pricing-plan'
import BillingSettings from '@/components/pages/protected/organization/billing/billing-settings'
import { useOrganization } from '@/hooks/useOrganization'
import { LoaderCircle } from 'lucide-react'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canEdit } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const BillingPage: React.FC = () => {
  const { data: session } = useSession()
  const { data: permission, isLoading } = useOrganizationRole(session)
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Billing', href: '/billing' },
    ])
  }, [setCrumbs])
  return (
    <>
      {!isLoading && !canEdit(permission?.roles) && <ProtectedArea />}
      {!isLoading && canEdit(permission?.roles) && (
        <>
          <PageHeading heading="Billing" eyebrow="Organization Settings" />
          <Suspense>
            <OrganizationContent />
          </Suspense>
        </>
      )}
    </>
  )
}

export default BillingPage

const OrganizationContent = () => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationBilling(currentOrgId)

  if (isLoading) {
    return (
      <div className="w-100 flex justify-center">
        <LoaderCircle className="animate-spin" size={20} />
      </div>
    )
  }

  return (
    <>
      {data?.organization.personalOrg ? (
        <div className={`flex items-center justify-center min-h-[50vh] text-center`}>
          <h2 className="text-xl w-full max-w-2xl">
            You&apos;re currently logged into your personal organization - you can switch into another organization you are a member of, or create an organization to use paid features of the Openlane
            platform.
          </h2>
        </div>
      ) : (
        <div className={` flex w-full`}>
          <PricingPlan />
          <BillingSettings />
        </div>
      )}
    </>
  )
}
