'use client'

import React, { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Callout } from '@/components/shared/callout/callout'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { subprocessorListingBlockedReason } from '@/components/pages/protected/trust-center/shared/subprocessor-listing-availability'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission, isImpersonation } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { ADD_SUBPROCESSORS_FROM_VENDORS_HREF, SUBPROCESSORS_HREF } from '../subprocessor-routes'
import { VendorSubprocessorPicker } from './vendor-subprocessor-picker'

const useUnavailableReason = (): { isChecking: boolean; reason?: string } => {
  const { data: session } = useSession()
  const { data: orgPermission, isPending: isRolesPending, isError: isRolesError } = useOrganizationRoles()
  const { data, isPending, isError } = useGetTrustCenter()
  const isSupportSession = isImpersonation(session)
  if (isPending || (isRolesPending && !isSupportSession)) return { isChecking: true }
  if (isError || (isRolesError && !isSupportSession)) return { isChecking: false, reason: 'We could not load your Trust Center. Please try again later.' }

  const blockedReason = subprocessorListingBlockedReason(getNodes(data?.trustCenters)[0])
  if (blockedReason) return { isChecking: false, reason: blockedReason }
  if (!hasPermission(orgPermission?.roles, AccessEnum.CanCreateTrustCenterSubprocessor, session)) {
    return { isChecking: false, reason: 'You do not have permission to add subprocessors to your Trust Center.' }
  }
  return { isChecking: false }
}

export const AddSubprocessorsFromVendorsPage: React.FC = () => {
  const router = useRouter()
  const { setCrumbs } = use(BreadcrumbContext)
  const { isChecking, reason } = useUnavailableReason()

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Trust Center', href: '/trust-center/overview' },
      { label: 'Subprocessors', href: SUBPROCESSORS_HREF },
      { label: 'Add from vendors', href: ADD_SUBPROCESSORS_FROM_VENDORS_HREF },
    ])
  }, [setCrumbs])

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <Button variant="secondary" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(SUBPROCESSORS_HREF)}>
          Back to Subprocessors
        </Button>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Add subprocessors from vendors</h2>
        <p className="text-sm text-muted-foreground">Select the vendors to list on your Trust Center, then set the countries and category for each one.</p>
      </div>
      {isChecking ? <StatusLine>Checking your Trust Center...</StatusLine> : reason ? <Callout variant="info">{reason}</Callout> : <VendorSubprocessorPicker />}
    </div>
  )
}
