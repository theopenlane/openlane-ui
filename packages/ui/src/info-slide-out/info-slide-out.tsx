'use client'

import * as React from 'react'
import { ExternalLink, InfoIcon, PanelRightClose } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../sheet/sheet'

type InfoSlideOutProps = {
  title: string
  children: React.ReactNode
  /** Render prop — receives `open` callback so callers can wire any element as the trigger */
  trigger?: (open: () => void) => React.ReactNode
  /** Optional URL rendered as a "View documentation" link at the bottom of the panel */
  docsUrl?: string
  width?: number
}

export function InfoSlideOut({ title, children, trigger, docsUrl, width = 440 }: InfoSlideOutProps) {
  const [open, setOpen] = React.useState(false)
  const handleOpen = () => setOpen(true)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        trigger(handleOpen)
      ) : (
        <button type="button" onClick={handleOpen} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" aria-label={`Learn more about ${title}`}>
          <InfoIcon size={14} />
        </button>
      )}
      <SheetContent
        initialWidth={width}
        minWidth={380}
        resizable={false}
        header={
          <SheetHeader>
            <div className="flex items-center justify-between pb-1">
              <PanelRightClose aria-label="Close info panel" size={16} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpen(false)} />
            </div>
            <SheetTitle className="text-xl font-medium text-text-header">{title}</SheetTitle>
          </SheetHeader>
        }
      >
        <div className="flex flex-col gap-4">
          {children}
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
