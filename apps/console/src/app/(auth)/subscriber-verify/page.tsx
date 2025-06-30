import { LoaderCircle } from 'lucide-react'
import React, { Suspense } from 'react'
import { TokenVerifier } from '@/components/pages/auth/subscriber-verify/verifier'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Subscription',
}

const VerifySubscriber: React.FC = () => {
  return (
    <Suspense fallback={<LoaderCircle className="animate-spin" size={20} />}>
      <TokenVerifier />
    </Suspense>
  )
}

export default VerifySubscriber
