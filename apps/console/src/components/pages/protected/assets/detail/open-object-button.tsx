import React from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonStyles } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { openOnPlainClick } from '@/components/shared/object-sheet-link/object-sheet-link'
import { type ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'

type TOpenObjectButtonProps = { id: string; kind: ObjectAssociationNodeEnum; label: string }

export const OpenObjectButton: React.FC<TOpenObjectButtonProps> = ({ id, kind, label }) => {
  const openObjectSheet = useOpenObjectSheet()

  return (
    <NextLink
      href={getHrefForObjectType(kind, { id })}
      prefetch={false}
      onClick={openOnPlainClick(() => openObjectSheet(id, kind))}
      className={cn(buttonStyles({ variant: 'secondary' }).base(), 'shrink-0')}
    >
      {label}
      <ArrowRight size={16} aria-hidden />
    </NextLink>
  )
}
