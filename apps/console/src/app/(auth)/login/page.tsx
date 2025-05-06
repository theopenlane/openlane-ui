'use client'

import { Suspense, useState } from 'react'
import { LoginPage } from '@/components/pages/auth/login/login'
import AuthMarketingPanel from '@/components/shared/AuthMarketingPanel.tsx/auth-marketing-panel'

const AuthLogin: React.FC = () => {
  return (
    <>
      <Suspense>
        <div className="flex h-full w-full min-h-screen gap-60">
          <AuthMarketingPanel />
          <LoginPage />
        </div>
      </Suspense>
    </>
  )
}

export default AuthLogin
