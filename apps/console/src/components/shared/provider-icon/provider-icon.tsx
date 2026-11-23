'use client'

import React from 'react'
import Image from 'next/image'
import { getProviderIcon } from '@/lib/integrations/utils'

type ProviderIconProps = {
  providerName: string
  logoUrl?: string
  className?: string
  alt?: string
}

const ProviderIcon = ({ providerName, logoUrl, className = 'object-contain', alt = `${providerName} icon` }: ProviderIconProps) => {
  const iconSrc = logoUrl || getProviderIcon(providerName)
  if (!iconSrc) {
    return null
  }

  return <Image src={iconSrc} alt={alt} width={24} height={24} unoptimized className={className} />
}

export default ProviderIcon
