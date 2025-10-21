'use client'
import React, { ReactNode } from 'react'

interface AuthMarketingPanelProps {
  children?: ReactNode
}

const AuthMarketingPanel = ({ children }: AuthMarketingPanelProps) => {
  return (
    <div className="hidden lg:flex flex-col justify-center p-10 rounded-lg w-2/5">
      <div className="flex flex-col space-y-10 ml-5">{children}</div>
    </div>
  )
}

export default AuthMarketingPanel
