'use client'

import React from 'react'
import { Copy } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useNotification } from '@/hooks/useNotification'
import { copyableTextStyles, type CopyableTextVariants } from './copyable-text.styles'

type Props = CopyableTextVariants & {
  value: string
  className?: string
  'aria-label'?: string
}

const CopyableText: React.FC<Props> = ({ value, className, variant, 'aria-label': ariaLabel }) => {
  const { successNotification, errorNotification } = useNotification()
  const styles = copyableTextStyles({ variant })

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
    <button type="button" onClick={handleCopy} aria-label={ariaLabel ?? `Copy ${value}`} className={cn(styles.trigger(), className)}>
      <span className={styles.value()}>{value}</span>
      <Copy size={12} className={styles.icon()} />
    </button>
  )
}

export default CopyableText
