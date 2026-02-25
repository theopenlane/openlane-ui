import React, { useState, useRef, ReactNode, useEffect } from 'react'
import { PanelRight, PanelRightClose } from 'lucide-react'
import { Button } from '@repo/ui/button'

type TSlideBarLayoutProps = {
  sidebarTitle?: string
  sidebarContent: ReactNode
  children: ReactNode
  menu?: ReactNode
  slideOpen?: boolean
  minWidth?: number
  collapsedContentClassName?: string
  collapsedButtonClassName?: string
  hasScrollbar?: boolean
}

const MAX_RATIO = 0.9
const DEFAULT_WIDTH = 400
const FLOATING_MARGIN = 24
const SCROLLBAR_OFFSET = '3rem'

const SlideBarLayout: React.FC<TSlideBarLayoutProps> = ({
  sidebarTitle,
  sidebarContent,
  children,
  menu,
  slideOpen,
  minWidth = 400,
  collapsedContentClassName,
  collapsedButtonClassName,
  hasScrollbar,
}) => {
  const [open, setOpen] = useState<boolean>(true)
  const [width, setWidth] = useState<number>(minWidth || DEFAULT_WIDTH)
  const resizing = useRef(false)

  useEffect(() => {
    if (slideOpen) {
      setOpen(true)
    }
  }, [slideOpen])

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing.current) {
      return
    }

    const newWidth = window.innerWidth - e.clientX
    if (newWidth > minWidth && newWidth < window.innerWidth * MAX_RATIO) {
      setWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    if (!resizing.current) {
      return
    }

    resizing.current = false
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    resizing.current = true
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="relative flex">
      <div
        className={`transition-all duration-300 overflow-auto${!open && collapsedContentClassName ? ` ${collapsedContentClassName}` : ''}`}
        style={{ width: open ? `calc(100% - ${width}px)` : '100%' }}
      >
        {children}
      </div>

      <div className="fixed flex items-center space-x-2 z-30" style={{ top: '5rem', right: `${FLOATING_MARGIN}px` }}>
        {menu}
        <Button
          type="button"
          descriptiveTooltipText={open ? 'Close slide bar' : 'Open slide bar'}
          variant="secondary"
          onClick={() => setOpen(!open)}
          className={`h-8 !px-2 !pl-0${!open && hasScrollbar && collapsedButtonClassName ? ` ${collapsedButtonClassName}` : ''}`}
          style={{ transform: !open && hasScrollbar && !collapsedButtonClassName ? `translateX(-${SCROLLBAR_OFFSET})` : 'translateX(0)' }}
          icon={open ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
        />
      </div>
      <div
        className="fixed right-0 mt-[4px] mb-[8px] rounded-md bottom-0 border-l shadow-xl transform transition-transform duration-300 z-20 bg-secondary"
        style={{
          top: '4rem',
          width: open ? `${width}px` : 0,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          marginRight: open ? '8px' : '0',
        }}
      >
        {sidebarTitle ? (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium truncate mr-2">{sidebarTitle}</h2>
          </div>
        ) : (
          <div className="p-4"></div>
        )}

        <div onMouseDown={startResize} className="absolute left-0 top-0 h-full w-1 cursor-col-resize" />

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-64px)]">{sidebarContent}</div>
      </div>
    </div>
  )
}

export default SlideBarLayout
