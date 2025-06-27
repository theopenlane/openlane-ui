import PasswordResetPage from '@/components/pages/auth/password-reset/page'
import { Loading } from '@/components/shared/loading/loading'
import { Suspense } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Password Reset',
}

export default function PasswordResetPageWrapper() {
  return (
    <Suspense fallback={<Loading />}>
      <PasswordResetPage />
    </Suspense>
  )
}
