'use client'

import React from 'react'
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

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={iconSrc} alt={`${providerName} icon`} className={className} />
}

export default ProviderIcon
