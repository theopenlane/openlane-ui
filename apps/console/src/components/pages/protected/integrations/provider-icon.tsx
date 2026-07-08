'use client'

import React from 'react'
import Image from 'next/image'
import { getProviderIcon } from '@/lib/integrations/utils'

type ProviderIconProps = {
  providerName: string
  logoUrl?: string
  className?: string
}

const ProviderIcon = ({ providerName, logoUrl, className = 'object-contain' }: ProviderIconProps) => {
  const iconSrc = logoUrl || getProviderIcon(providerName)
  if (!iconSrc) {
    return null
  }

  return <Image src={iconSrc} alt={`${providerName} icon`} width={24} height={24} className={className} />
}

export default ProviderIcon
