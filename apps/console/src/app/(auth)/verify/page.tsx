import React, { Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { TokenVerifier } from '@/components/pages/auth/verify/verifier'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verification',
}

export const dynamic = 'force-dynamic'

const VerifyUser: React.FC = () => {
  return (
    <Suspense fallback={<LoaderCircle className="animate-spin" size={20} />}>
      <TokenVerifier />
    </Suspense>
  )
}

export default VerifyUser
