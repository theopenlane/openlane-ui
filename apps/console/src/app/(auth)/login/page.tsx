'use client'

import { Logo } from '@repo/ui/logo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Suspense, useState } from 'react'
import { pageStyles } from './page.styles'
import { LoginPage } from '@/components/pages/auth/login/login'
import { SignupPage } from '@/components/pages/auth/signup/signup'

const AuthLogin: React.FC = () => {
  const defaultTab = 'login'
  const { bg, content, logo } = pageStyles()
  const [activeTab, setActiveTab] = useState(defaultTab)
  return (
    <>
      <Suspense>
        <div className={content()}>
          <div className={logo()}>
            <Logo width={300} theme="light" />
          </div>
          <Tabs
            variant="underline"
            defaultValue={defaultTab}
            onValueChange={(value) => {
              setActiveTab(value)
            }}
          >
            <TabsList>
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Signup</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginPage />
            </TabsContent>
            <TabsContent value="signup">
              <SignupPage />
            </TabsContent>
          </Tabs>
        </div>
        <div className={bg({ activeBg: activeTab === 'login' })}></div>
        <div className={bg({ activeBg: activeTab === 'signup' })}></div>
      </Suspense>
    </>
  )
}

export default AuthLogin
