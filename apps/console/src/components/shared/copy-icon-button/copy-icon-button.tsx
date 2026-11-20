'use client'

import React from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useCopyWithNotification } from '@/hooks/useCopyWithNotification'

type CopyIconButtonProps = {
  value: string
  label: string
}

export const CopyIconButton: React.FC<CopyIconButtonProps> = ({ value, label }) => {
  const copy = useCopyWithNotification()

  const handleCopy = (event: React.MouseEvent) => {
    event.stopPropagation()
    copy(value, `"${value}"`)
  }

  return (
    <Button type="button" variant="icon" descriptiveTooltipText={`Copy ${label}`} onClick={handleCopy} className="-m-1.5 h-6 w-6 gap-0 p-0 duration-150 [&_svg]:size-[13px]!">
      <Copy size={13} />
    </Button>
  )
}
