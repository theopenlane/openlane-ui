'use client'

import { Suspense } from 'react'
import { LoginPage } from '@/components/pages/auth/login/login'
import AuthMarketingPanel from '@/components/shared/AuthMarketingPanel.tsx/auth-marketing-panel'

const AuthLogin: React.FC = () => {
  return (
    <>
      <Suspense>
        <div className="flex h-full w-full min-h-screen gap-60">
          <AuthMarketingPanel>
            <h2 className="text-4xl font-normal">
              Checkboxes don’t
              <br /> build trust. We do.
            </h2>
          </AuthMarketingPanel>{' '}
          <LoginPage />
        </div>
      </Suspense>
    </>
  )
}

export default AuthLogin
