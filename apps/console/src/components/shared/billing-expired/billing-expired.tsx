'use client'
import { ArrowLeftRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORT_URL } from '@/constants'
import LockedScreen from '@/components/shared/locked-screen/locked-screen'

const BillingExpired: React.FC = () => {
  const router = useRouter()

  return (
    <LockedScreen
      heading="Your organization doesn't have an active Openlane subscription, so most of the app is locked right meow."
      description={
        <>
          Only the organization owner or a super admin can set up billing and restore access. Reach out to them, or{' '}
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="underline">
            contact support
          </a>
          .
        </>
      }
      action={
        <Button icon={<ArrowLeftRight />} iconPosition="left" onClick={() => router.push('/organization')}>
          Switch organization
        </Button>
      }
    />
  )
}

export default BillingExpired
