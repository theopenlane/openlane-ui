'use client'

import { LoaderCircle } from 'lucide-react'
import { Suspense} from 'react'
import { TokenVerifier } from '@/components/pages/auth/subscriber-verify/verifier'

const VerifySubscriber: React.FC = () => {
 return(
  <Suspense
    fallback={<LoaderCircle className="animate-spin" size={20} />}
  >
    <TokenVerifier />
  </Suspense>
 )
}

export default VerifySubscriber
