'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'

type SectionCardProps = {
  title: React.ReactNode
  count?: number
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  titleAction?: React.ReactNode
  className?: string
}

export const SectionCard = ({ title, count, description, children, footer, collapsible = false, defaultOpen = true, titleAction, className }: SectionCardProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = collapsible ? open : true

  return (
    <Card className={className}>
      <CardTitle
        className={`flex items-center justify-between gap-2 text-xl py-3 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((value) => !value) : undefined}
      >
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined ? <Badge variant="secondary">{count}</Badge> : null}
        </span>
        <span className="flex items-center gap-2 font-normal">
          {titleAction}
          {collapsible ? <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} /> : null}
        </span>
      </CardTitle>
      {description ? <CardDescription className="pb-3">{description}</CardDescription> : null}
      {isOpen ? (
        <>
          <Separator separatorClass="bg-border" />
          <CardContent className="p-0">{children}</CardContent>
        </>
      ) : null}
      {footer ? (
        <>
          <Separator separatorClass="bg-border" />
          <CardFooter className="py-3">{footer}</CardFooter>
        </>
      ) : null}
    </Card>
  )
}
