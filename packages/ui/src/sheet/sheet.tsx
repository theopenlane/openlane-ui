import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { DialogTitle } from '@repo/ui/components/ui/dialog.tsx'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

type SheetVariants = VariantProps<typeof sheetVariants>

const sheetVariants = cva(
  'fixed z-50 overflow-hidden gap-4 bg-background p-[24px] pt-[12px] shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-[1500px]',
        right: 'inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[1500px]',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, SheetVariants {
  minWidth?: number
  initialWidth?: number
  resizable?: boolean
  header?: React.ReactNode
}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className, children, minWidth = 400, initialWidth = 825, resizable = true, header, ...props }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => localRef.current!)

    const defaultWidth = `${initialWidth}px`
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
        if (newWidth < minWidth) {
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
        <SheetPrimitive.Content ref={localRef} className={cn(sheetVariants({ side }), className)} style={{ width, minWidth }} {...props}>
          <div onMouseDown={onMouseDown} className={cn('absolute top-0 bottom-0 h-full z-10 w-3 bg-transparent', side === 'right' ? '-left-1 cursor-ew-resize' : '-right-1 cursor-ew-resize')} />

          <DialogTitle>
            <div className="sr-only">Sheet Title</div>
          </DialogTitle>

          {header && <SheetHeader className="sticky top-0 z-10">{header}</SheetHeader>}

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col h-full">{children}</div>
          </div>
        </SheetPrimitive.Content>
      </SheetPortal>
    )
  },
)

SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Title>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-2xl font-medium text-foreground mt-5', className)} {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Description>, React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-base text-muted-foreground mt-5', className)} {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription }
