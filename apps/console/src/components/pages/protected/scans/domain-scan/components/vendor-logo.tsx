'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Building2 } from 'lucide-react'

export const VendorLogo = ({ name, logoUrl }: { name: string; logoUrl?: string }) => {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [logoUrl])

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
      {logoUrl && !failed ? (
        <Image src={logoUrl} alt={`${name} logo`} width={32} height={32} unoptimized className="h-full w-full object-contain p-1" onError={() => setFailed(true)} />
      ) : (
        <Building2 size={16} className="text-muted-foreground" />
      )}
    </div>
  )
}
