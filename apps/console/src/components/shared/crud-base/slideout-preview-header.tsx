'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { SlideoutHeader } from './slideout-header'

type SlideoutPreviewHeaderProps = {
  title: string
  titleAdornment?: React.ReactNode
  fullPagePath?: string | null
  close: () => void
}

export const SlideoutPreviewHeader = ({ title, titleAdornment, fullPagePath, close }: SlideoutPreviewHeaderProps) => {
  const router = useRouter()

  return (
    <SlideoutHeader
      title={title}
      titleAdornment={titleAdornment}
      onClose={close}
      primaryAction={
        fullPagePath
          ? {
              label: 'Open full page',
              icon: <ExternalLink size={16} />,
              variant: 'secondary',
              onClick: () => {
                close()
                router.push(fullPagePath)
              },
            }
          : undefined
      }
    />
  )
}
