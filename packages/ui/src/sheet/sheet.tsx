'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn('data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50', className)}
      {...props}
    />
  )
}

type TSheetContentProps = {
  minWidth?: number | string
  initialWidth?: number | string
  resizable?: boolean
  header?: React.ReactNode
}

function SheetContent({
  className,
  children,
  side = 'right',
  minWidth = 400,
  initialWidth = 825,
  resizable = true,
  header,
  ref,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  TSheetContentProps & {
    side?: 'top' | 'right' | 'bottom' | 'left'
  }) {
  const localRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => localRef.current!)

  const defaultWidth = typeof initialWidth === 'number' ? `${initialWidth}px` : initialWidth
  const [width, setWidth] = React.useState<string | undefined>(defaultWidth)
  const isResizing = React.useRef(false)

  React.useEffect(() => {
    if (!resizable) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) {
        return
      }

      const x = e.clientX
      let newWidth = side === 'right' ? window.innerWidth - x : x
      if (typeof minWidth === 'number' && newWidth < minWidth) {
        newWidth = minWidth
      }
      setWidth(`${newWidth}px`)
    }
    const handleMouseUp = () => {
      isResizing.current = false
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizable, side, minWidth])

  const onMouseDown = () => {
    if (resizable) {
      isResizing.current = true
    }
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        style={{ width, minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }}
        data-slot="sheet-content"
        className={cn(
          'gap-4 p-[24px] pt-[12px] bg-secondary data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
          side === 'right' && 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l ',
          side === 'left' && 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r',
          side === 'top' && 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b',
          side === 'bottom' && 'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t',
          className,
        )}
        {...props}
      >
        <div onMouseDown={onMouseDown} className={cn('absolute top-0 bottom-0 h-full z-10 w-3 bg-transparent', side === 'right' ? '-left-1 cursor-ew-resize' : '-right-1 cursor-ew-resize')} />

        {header && <SheetHeader className="sticky top-0 z-10">{header}</SheetHeader>}

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col h-full">{children}</div>
        </div>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-header" className={cn('flex flex-col', className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-footer" className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn('text-foreground font-semibold', className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn('text-muted-foreground text-sm', className)} {...props} />
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
