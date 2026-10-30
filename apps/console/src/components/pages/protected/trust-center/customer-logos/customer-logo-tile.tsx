'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { cn } from '@repo/ui/lib/utils'
import { readableTextColor } from '@/utils/color-contrast'

type CustomerLogoTileProps = {
  background: string
  src?: string | null
  alt: string
  placeholder: React.ReactNode
  className?: string
}

export const CustomerLogoTile = ({ background, src, alt, placeholder, className }: CustomerLogoTileProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = !!src && src !== failedSrc

  return (
    <div
      className={cn('relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border', className)}
      style={{ backgroundColor: background, color: readableTextColor(background) }}
    >
      {showImage ? <Image src={src} alt={alt} fill unoptimized className="object-contain p-1" onError={() => setFailedSrc(src)} /> : <span className="opacity-50">{placeholder}</span>}
    </div>
  )
}
