'use client'

import PasswordResetPage from '@/components/pages/auth/password-reset/page'
import { Loading } from '@/components/shared/loading/loading'
import { Suspense } from 'react'

export default function PasswordResetPageWrapper() {
  return (
    <Suspense fallback={<Loading />}>
      <PasswordResetPage />
    </Suspense>
  )
}
