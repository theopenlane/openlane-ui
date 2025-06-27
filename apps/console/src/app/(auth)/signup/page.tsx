import { Suspense } from 'react'
import AuthMarketingPanel from '@/components/shared/AuthMarketingPanel.tsx/auth-marketing-panel'
import { SignupPage } from '@/components/pages/auth/signup/signup'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Signup',
}

const AuthLogin: React.FC = () => {
  return (
    <>
      <Suspense>
        <div className="flex h-full w-full min-h-screen gap-4 sm:gap-8 md:gap-12 lg:gap-20 xl:gap-60 justify-center lg:justify-start">
          <AuthMarketingPanel>
            <h2 className="text-4xl font-normal">
              Built for Developers,
              <br />
              Loved by Auditors
            </h2>
            <p className="text-xl font-muted-foreground">
              Join us at Openlane,
              <br />
              because compliance isn't just a checkbox.
            </p>
          </AuthMarketingPanel>{' '}
          <SignupPage />
        </div>
      </Suspense>
    </>
  )
}

export default AuthLogin
