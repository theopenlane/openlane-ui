import React, { Suspense } from 'react'
import { LoaderCircle } from 'lucide-react'
import { InviteAccepter } from '@/components/pages/invite/accept'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invite',
}

const AcceptInvite: React.FC = () => {
  return (
    <Suspense fallback={<LoaderCircle className="animate-spin" size={20} />}>
      <InviteAccepter />
    </Suspense>
  )
}

export default AcceptInvite
