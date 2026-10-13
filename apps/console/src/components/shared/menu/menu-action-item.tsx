'use client'

import React from 'react'
import Link from 'next/link'
import { DropdownMenuItem } from '@repo/ui/dropdown-menu'
import { cn } from '@repo/ui/lib/utils'
import { type TElementAnchor } from '@/components/shared/element-anchor/element-anchor'

export type TMenuAction = {
  key: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  destructive?: boolean
  anchor?: TElementAnchor
} & ({ onClick: () => void; href?: never } | { href: string; onClick?: never })

export const orderMenuActions = <T extends { destructive?: boolean }>(actions: T[]): T[] => [...actions.filter((a) => !a.destructive), ...actions.filter((a) => a.destructive)]

export const MenuActionItem = ({ action: { label, icon, onClick, href, disabled, destructive, anchor } }: { action: TMenuAction }) => {
  const className = cn('flex items-center gap-2 px-1 *:pointer-events-none', destructive && 'text-destructive')
  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  )

  return href ? (
    <DropdownMenuItem asChild disabled={disabled} className={className} {...anchor}>
      <Link href={href}>{content}</Link>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem onSelect={onClick} disabled={disabled} className={className} {...anchor}>
      {content}
    </DropdownMenuItem>
  )
}
