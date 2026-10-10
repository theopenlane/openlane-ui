import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PanelRight, PanelRightClose } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { MAIN_SCROLLBAR_HEIGHT_VAR, TOP_BANNER_HEIGHT_VAR } from '@/constants/layout'

type TSlideBarLayoutProps = {
  sidebarTitle?: string
  sidebarContent: ReactNode
  children: ReactNode
  slideOpen?: boolean
  minWidth?: number
  collapsedContentClassName?: string
}

type TSlideBarContext = {
  open: boolean
  toggle: () => void
  registerInlineToggle: () => () => void
}

const MAX_RATIO = 0.9
const DEFAULT_WIDTH = 400
const FLOATING_MARGIN = 24

function setBodyUserSelect(value: string) {
  document.body.style.userSelect = value
}

const SlideBarContext = createContext<TSlideBarContext | null>(null)

const SlideBarToggleButton = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <Button
    type="button"
    descriptiveTooltipText={open ? 'Close slide bar' : 'Open slide bar'}
    variant="secondary"
    onClick={onClick}
    className="h-8 !px-2 !pl-0"
    icon={open ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
  />
)

export const InlineSlideBarToggle = () => {
  const slideBar = use(SlideBarContext)
  const registerInlineToggle = slideBar?.registerInlineToggle

  useEffect(() => registerInlineToggle?.(), [registerInlineToggle])

  if (!slideBar || slideBar.open) {
    return null
  }

  return <SlideBarToggleButton open={false} onClick={slideBar.toggle} />
}

const SlideBarLayout: React.FC<TSlideBarLayoutProps> = ({ sidebarTitle, sidebarContent, children, slideOpen, minWidth = 400, collapsedContentClassName }) => {
  const [open, setOpen] = useState<boolean>(true)
  const [inlineToggleCount, setInlineToggleCount] = useState(0)
  const [width, setWidth] = useState<number>(minWidth || DEFAULT_WIDTH)
  const resizingRef = useRef(false)
  const resizeTargetRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const resizeOriginXRef = useRef(0)

  useEffect(() => {
    if (slideOpen) {
      setOpen(true)
    }
  }, [slideOpen])

  const toggle = useCallback(() => setOpen((current) => !current), [])

  const registerInlineToggle = useCallback(() => {
    setInlineToggleCount((count) => count + 1)
    return () => setInlineToggleCount((count) => count - 1)
  }, [])

  const slideBarContext = useMemo(() => ({ open, toggle, registerInlineToggle }), [open, toggle, registerInlineToggle])

  const minWidthRef = useRef(minWidth)
  useEffect(() => {
    minWidthRef.current = minWidth
  }, [minWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) {
        return
      }

      const newWidth = resizeOriginXRef.current - e.clientX
      if (newWidth > minWidthRef.current && newWidth < window.innerWidth * MAX_RATIO) {
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (!resizingRef.current) {
        return
      }

      resizingRef.current = false
      setBodyUserSelect('')
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    const startResizeHandler = () => {
      resizingRef.current = true
      setBodyUserSelect('none')
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    const resizeTarget = resizeTargetRef.current
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      resizeOriginXRef.current = railRef.current?.getBoundingClientRect().right ?? window.innerWidth
      startResizeHandler()
    }

    if (resizeTarget) {
      resizeTarget.addEventListener('mousedown', onMouseDown)
    }

    return () => {
      if (resizeTarget) {
        resizeTarget.removeEventListener('mousedown', onMouseDown)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <SlideBarContext value={slideBarContext}>
      <div className="relative flex">
        <div
          className={`transition-all duration-300 overflow-x-clip${!open && collapsedContentClassName ? ` ${collapsedContentClassName}` : ''}`}
          style={{ width: open ? `calc(100% - ${width}px)` : '100%' }}
        >
          {children}
        </div>

        {(open || inlineToggleCount === 0) && (
          <div className="fixed z-30 follows-pinned-panel-scroll" style={{ top: `calc(5rem + var(${TOP_BANNER_HEIGHT_VAR}, 0px))`, right: `${FLOATING_MARGIN}px` }}>
            <SlideBarToggleButton open={open} onClick={toggle} />
          </div>
        )}
        <div
          ref={railRef}
          className="fixed right-0 rounded-md bottom-0 border-l shadow-xl transform transition-transform duration-300 z-20 bg-secondary follows-pinned-panel-scroll"
          style={{
            top: `calc(4rem + var(${TOP_BANNER_HEIGHT_VAR}, 0px))`,
            marginTop: `max(0px, calc(4px - var(${TOP_BANNER_HEIGHT_VAR}, 0px)))`,
            width: open ? `${width}px` : 0,
            transform: open ? 'translateX(0)' : 'translateX(100%)',
            marginRight: open ? '8px' : '0',
            marginBottom: `calc(8px + var(${MAIN_SCROLLBAR_HEIGHT_VAR}, 0px))`,
          }}
        >
          {sidebarTitle ? (
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium truncate mr-2">{sidebarTitle}</h2>
            </div>
          ) : (
            <div className="p-4"></div>
          )}

          <div ref={resizeTargetRef} className="absolute left-0 top-0 h-full w-1 cursor-col-resize" />

          <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-64px)]">{sidebarContent}</div>
        </div>
      </div>
    </SlideBarContext>
  )
}

export default SlideBarLayout
