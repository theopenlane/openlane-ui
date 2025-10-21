import React, { Suspense } from 'react'
import { LoginPage } from '@/components/pages/auth/login/login'
import AuthMarketingPanel from '@/components/shared/AuthMarketingPanel.tsx/auth-marketing-panel'
import { Metadata } from 'next'
import { Logo } from '@repo/ui/logo'

export const metadata: Metadata = {
  title: 'Login',
}

const AuthLogin: React.FC = () => {
  return (
    <Suspense>
      <div className="flex h-full w-full min-h-screen">
        <div className="flex flex-col justify-between items-center w-full lg:w-4/5 p-6 bg-secondary relative">
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <Logo width={200} />
          </div>

          <div className="flex justify-center items-center w-full h-full">
            <LoginPage />
          </div>
        </div>

        <AuthMarketingPanel />
      </div>
    </Suspense>
  )
}

export default AuthLogin
