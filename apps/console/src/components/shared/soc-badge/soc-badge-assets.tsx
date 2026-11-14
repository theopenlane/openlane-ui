'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { CodeBlock } from '@repo/ui/code-block'
import { useNotification } from '@/hooks/useNotification'
import { fileDownload } from '@/components/shared/lib/export'
import { SOC_BADGE_EMBED_WIDTH, type TSocBadge, buildSocBadgeEmbedCode } from './soc-badge-config'

type TSocBadgeAssetsProps = {
  badge: TSocBadge
}

export const SocBadgeAssets: React.FC<TSocBadgeAssetsProps> = ({ badge }) => {
  const { errorNotification } = useNotification()
  const [isDownloading, setIsDownloading] = useState(false)
  const downloadInFlightRef = useRef(false)

  const handleDownload = async () => {
    if (downloadInFlightRef.current) return
    downloadInFlightRef.current = true
    setIsDownloading(true)
    try {
      await fileDownload(badge.imageUrl, badge.fileName, errorNotification)
    } finally {
      downloadInFlightRef.current = false
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Image src={badge.imageUrl} alt={badge.alt} width={SOC_BADGE_EMBED_WIDTH} height={SOC_BADGE_EMBED_WIDTH} unoptimized className="h-auto self-start object-contain" />

      <div className="flex flex-col gap-2">
        <p className="text-base">Download the image</p>
        <div>
          <Button variant="secondary" icon={<Download size={16} />} iconPosition="left" onClick={handleDownload} loading={isDownloading} disabled={isDownloading}>
            Download {badge.label} logo
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-base">Or embed it with our hosted image</p>
        <p className="text-sm text-muted-foreground">Paste this into your website, for example in the footer. It links to the AICPA and shows the logo {SOC_BADGE_EMBED_WIDTH}px wide.</p>
        <CodeBlock code={buildSocBadgeEmbedCode(badge)} language="html" />
      </div>
    </div>
  )
}
