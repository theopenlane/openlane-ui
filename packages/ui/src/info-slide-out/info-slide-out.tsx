'use client'

import * as React from 'react'
import { ExternalLink, InfoIcon, PanelRightClose } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../sheet/sheet'

type InfoSlideOutProps = {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  trigger?: (open: () => void) => React.ReactNode
  docsUrl?: string
  icon?: React.ReactNode
  width?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function InfoSlideOut({ title, subtitle, children, trigger, docsUrl, icon, width = 440, open: controlledOpen, onOpenChange }: InfoSlideOutProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger
        ? trigger(handleOpen)
        : !isControlled && (
            <button type="button" onClick={handleOpen} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" aria-label={`Learn more about ${title}`}>
              <InfoIcon size={14} />
            </button>
          )}
      <SheetContent
        initialWidth={width}
        minWidth={380}
        resizable={false}
        onClick={(e) => e.stopPropagation()}
        header={
          <SheetHeader>
            <div className="flex items-center justify-between pb-1">
              <PanelRightClose aria-label="Close info panel" size={16} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpen(false)} />
            </div>
            <div className="flex items-stretch gap-2">
              {icon}
              <div className="flex flex-col justify-center">
                <SheetTitle className="text-xl font-medium text-text-header">{title}</SheetTitle>
                {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
              </div>
            </div>
          </SheetHeader>
        }
      >
        <div className="flex flex-col gap-4">
          {typeof children === 'function' ? children(handleClose) : children}
          {docsUrl && (
            <div className="pt-3 border-t border-border">
              <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-info)] hover:underline underline-offset-4">
                View documentation
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
