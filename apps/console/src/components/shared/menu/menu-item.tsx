import React from 'react'
import Link from 'next/link'
import { Button, type ButtonProps } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'

type MenuItemProps = Omit<ButtonProps, 'variant' | 'onClick' | 'icon' | 'children'> & {
  icon?: React.ReactNode
  onSelect?: () => void
  destructive?: boolean
  href?: string
  children: React.ReactNode
}

const MenuItem = ({ icon, onSelect, destructive, href, className, children, ...rest }: MenuItemProps) => {
  const content = (
    <>
      {icon}
      <span>{children}</span>
    </>
  )
  const buttonClassName = cn(destructive && 'text-destructive', className)

  if (href) {
    return (
      <Button asChild variant="menuItem" onClick={onSelect} className={buttonClassName} {...rest}>
        <Link href={href}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button type="button" variant="menuItem" onClick={onSelect} className={buttonClassName} {...rest}>
      {content}
    </Button>
  )
}

export default MenuItem
