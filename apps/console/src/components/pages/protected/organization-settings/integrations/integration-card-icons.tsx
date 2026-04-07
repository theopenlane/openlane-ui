'use client'

import React from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { Logo } from '@repo/ui/logo'
import ProviderIcon from './provider-icon'

type IntegrationCardIconsProps = {
  providerName: string
  logoUrl?: string
}

const IntegrationCardIcons = ({ providerName, logoUrl }: IntegrationCardIconsProps) => {
  return (
    <div className="flex items-center gap-1 self-start">
      <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center">
        <Logo asIcon width={16} />
      </div>
      <ArrowLeftRight size={8} />
      <div className="w-[42px] h-[42px] border rounded-full flex items-center justify-center">
        <ProviderIcon providerName={providerName} logoUrl={logoUrl} className="h-6 w-6 object-contain" />
      </div>
    </div>
  )
}

export default IntegrationCardIcons
