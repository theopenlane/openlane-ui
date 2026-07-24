'use client'

import React from 'react'
import { Copy } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'

type Props = {
  value: string
  className?: string
}

const CopyableText: React.FC<Props> = ({ value, className }) => {
  const { successNotification, errorNotification } = useNotification()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      successNotification({ title: 'Copied', description: `"${value}" copied to clipboard.` })
    } catch {
      errorNotification({ title: 'Copy failed', description: 'Clipboard access is not available in this context.' })
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={`group flex items-center gap-1.5 text-left hover:text-foreground transition-colors ${className ?? ''}`}>
      <span className="break-all">{value}</span>
      <Copy size={12} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

export default CopyableText
