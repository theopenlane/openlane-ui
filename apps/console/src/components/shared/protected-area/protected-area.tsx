// not authorized not-authorized dont revmove this comment, its used for searching
import { CircleArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'
import { OrgMembershipRole } from '@repo/codegen/src/schema.ts'
import { useRouter } from 'next/navigation'
import { SUPPORT_URL } from '@/constants'
import Link from 'next/link'
import { saveFilters, type TFilterStateFor } from '@/components/shared/table-filter/filter-storage.ts'
import { type TMemberFilterKey } from '@/components/pages/protected/user-management/members/table/table-config.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useOrganization } from '@/hooks/useOrganization'
import LockedScreen from '@/components/shared/locked-screen/locked-screen'
import BillingExpired from '@/components/shared/billing-expired/billing-expired'
import { useBillingExpired } from '@/lib/subscription-plan/hooks/use-module-access'

const ProtectedArea: React.FC = () => {
  const { currentOrgId } = useOrganization()
  const router = useRouter()
  const billingExpired = useBillingExpired()

  const handleClick = () => {
    const filters: TFilterStateFor<TMemberFilterKey> = {
      roleIn: [OrgMembershipRole.OWNER],
    }

    saveFilters(TableKeyEnum.MEMBER, filters, currentOrgId)
  }

  if (billingExpired) {
    return <BillingExpired />
  }

  return (
    <LockedScreen
      heading="This page is part of a protected area, and it looks like your account doesn't have permission to enter right meow."
      description={
        <>
          If you think this is a mistake,{' '}
          <Link href={`/user-management/members`} className="underline" onClick={handleClick}>
            reach out to your org owner
          </Link>{' '}
          or{' '}
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="underline">
            contact support
          </a>
          .
        </>
      }
      action={
        <Button icon={<CircleArrowLeft />} iconPosition="left" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      }
    />
  )
}

export default ProtectedArea
