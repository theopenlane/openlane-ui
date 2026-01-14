'use client'

import { SUPPORT_URL } from '@/constants'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { Button } from '@repo/ui/button'
import { CircleArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type TrustCenterProps = {
  children: React.ReactNode
}

const TrustCenter = ({ children }: TrustCenterProps) => {
  const router = useRouter()
  const { data } = useGetTrustCenter()
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  if (!trustCenter) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 text-center px-8">
        <div className="px-4 w-[607px]">
          <p className="text-3xl font-semibold mb-3 leading-9"> Trust Center temporarily unavailable</p>
          <p className="text-sm mb-6">
            We ran into an unexpected issue while loading this page. Your access hasn&apos;t changed — please try again shortly or reach out to support if needed,{' '}
            <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="underline">
              contact support
            </a>
            .
          </p>
          <Button icon={<CircleArrowLeft />} iconPosition="left" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

export default TrustCenter
