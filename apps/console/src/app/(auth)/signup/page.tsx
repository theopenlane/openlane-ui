'use client'

import { Suspense } from 'react'
import AuthMarketingPanel from '@/components/shared/AuthMarketingPanel.tsx/auth-marketing-panel'
import { SignupPage } from '@/components/pages/auth/signup/signup'

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
          <SignupPage />
        </div>
      </Suspense>
    </>
  )
}

export default AuthLogin
