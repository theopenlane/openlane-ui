'use client'

import { Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { InviteAccepter } from '@/components/pages/invite/accept'

const AcceptInvite: React.FC = () => {
  return (
    <Suspense fallback={<LoaderCircle className="animate-spin" size={20} />}>
      <InviteAccepter />
    </Suspense>
  )
}

export default AcceptInvite
