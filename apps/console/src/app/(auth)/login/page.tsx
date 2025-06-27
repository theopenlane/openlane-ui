import { Suspense } from 'react'
import { LoginPage } from '@/components/pages/auth/login/login'
import AuthMarketingPanel from '@/components/shared/AuthMarketingPanel.tsx/auth-marketing-panel'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
}

const AuthLogin: React.FC = () => {
  return (
    <>
      <Suspense>
        <div className="flex h-full w-full min-h-screen gap-4 sm:gap-8 md:gap-12 lg:gap-20 xl:gap-60 justify-center lg:justify-start">
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
