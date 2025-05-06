'use client'

import { Suspense } from 'react'
import AuthMarketingPanel from '@/components/shared/AuthMarketingPanel.tsx/auth-marketing-panel'
import { SignupPage } from '@/components/pages/auth/signup/signup'

const AuthLogin: React.FC = () => {
  return (
    <>
      <Suspense>
        <div className="flex h-full w-full min-h-screen gap-4 sm:gap-8 md:gap-12 lg:gap-20 xl:gap-60 justify-center lg:justify-start">
          <AuthMarketingPanel>
            <h2 className="text-4xl font-normal">
              Compliance you
              <br /> can verify, not <br /> just report.
            </h2>
          </AuthMarketingPanel>{' '}
          <SignupPage />
        </div>
      </Suspense>
    </>
  )
}

export default AuthLogin
