'use client'

import React from 'react'
import Image from 'next/image'
import { getProviderIcon } from './config'

type ProviderIconProps = {
  providerName: string
  className?: string
}

const ProviderIcon = ({ providerName, className }: ProviderIconProps) => {
  const iconSrc = getProviderIcon(providerName)
  if (!iconSrc) {
    return null
  }

  return <Image src={iconSrc} alt={`${providerName} icon`} width={24} height={24} className={className} />
}

export default ProviderIcon
