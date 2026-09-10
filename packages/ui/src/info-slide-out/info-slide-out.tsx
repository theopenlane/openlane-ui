'use client'

import * as React from 'react'
import { ExternalLink, InfoIcon, Pin, PinOff, PanelRightClose } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../sheet/sheet'

export const PINNED_PANEL_WIDTH_VAR = '--pinned-panel-width'

type InfoSlideOutProps = {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  trigger?: (open: () => void) => React.ReactNode
  docsUrl?: string
  icon?: React.ReactNode
  width?: number
  resizable?: boolean
  edgeHandle?: React.ReactNode
  hideClose?: boolean
  /** non-modal leaves the page (and things like chat widgets) interactive while open */
  modal?: boolean
  /** dimming backdrop; defaults to following `modal` */
  overlay?: boolean
  /** class for the backdrop, e.g. bg-transparent for a modal panel that shouldn't dim */
  overlayClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  pinnable?: boolean
  pinned?: boolean
  onPinnedChange?: (pinned: boolean) => void
  pinnedWidthVar?: string
}

const PinToggle = ({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={pinned}
    aria-label={pinned ? 'Unpin panel' : 'Keep panel open'}
    title={pinned ? 'Unpin panel' : 'Keep panel open while you navigate'}
    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
  >
    {pinned ? <PinOff size={14} /> : <Pin size={14} />}
    <span>{pinned ? 'Unpin' : 'Keep open'}</span>
  </button>
)

export function InfoSlideOut({
  title,
  subtitle,
  children,
  trigger,
  docsUrl,
  icon,
  width = 440,
  resizable = false,
  edgeHandle,
  hideClose = false,
  modal = true,
  overlay = modal,
  overlayClassName,
  open: controlledOpen,
  onOpenChange,
  pinnable = false,
  pinned: controlledPinned,
  onPinnedChange,
  pinnedWidthVar = PINNED_PANEL_WIDTH_VAR,
}: InfoSlideOutProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const [internalPinned, setInternalPinned] = React.useState(false)
  const pinIsControlled = controlledPinned !== undefined
  const pinned = pinnable && (pinIsControlled ? !!controlledPinned : internalPinned)
  const togglePinned = () => {
    const next = !pinned
    if (!pinIsControlled) setInternalPinned(next)
    onPinnedChange?.(next)
  }

  const [panelWidth, setPanelWidth] = React.useState<string | undefined>(undefined)
  const ownsWidthVar = React.useRef(false)
  React.useEffect(() => {
    const root = document.documentElement
    const release = () => {
      if (!ownsWidthVar.current) return
      ownsWidthVar.current = false
      root.style.removeProperty(pinnedWidthVar)
    }
    if (!pinned || !open || !panelWidth) {
      release()
      return
    }
    ownsWidthVar.current = true
    root.style.setProperty(pinnedWidthVar, panelWidth)
    return release
  }, [pinned, open, panelWidth, pinnedWidthVar])

  const keepOpen = pinned ? (event: { preventDefault: () => void }) => event.preventDefault() : undefined

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={modal && !pinned}>
      {trigger
        ? trigger(handleOpen)
        : !isControlled && (
            <button type="button" onClick={handleOpen} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" aria-label={`Learn more about ${title}`}>
              <InfoIcon size={14} />
            </button>
          )}
      <SheetContent
        data-info-panel=""
        initialWidth={width}
        minWidth={380}
        resizable={resizable}
        edge={edgeHandle}
        overlay={overlay && !pinned}
        overlayClassName={overlayClassName}
        onWidthChange={setPanelWidth}
        onInteractOutside={keepOpen}
        onEscapeKeyDown={keepOpen}
        onClick={(e) => e.stopPropagation()}
        header={
          <SheetHeader>
            {(!hideClose || pinnable) && (
              <div className="flex items-center justify-between pb-1">
                {hideClose ? (
                  <span />
                ) : (
                  <PanelRightClose aria-label="Close info panel" size={16} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={() => setOpen(false)} />
                )}
                {pinnable && <PinToggle pinned={pinned} onToggle={togglePinned} />}
              </div>
            )}
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
