'use client'
import { Logo } from '@repo/ui/logo'
import React, { ReactNode } from 'react'

interface AuthMarketingPanelProps {
  children?: ReactNode
}

const AuthMarketingPanel = ({ children }: AuthMarketingPanelProps) => {
  return (
    <div className="hidden bg-auth lg:flex flex-col justify-center w-full max-w-lg p-10 mt-[18px] mr-[0px] mb-[25px] ml-[19px] rounded-lg flex-1">
      <div className="flex flex-col space-y-10 ml-5">
        <Logo asIcon width={50} />
        {children}
      </div>
    </div>
  )
}

export default AuthMarketingPanel
