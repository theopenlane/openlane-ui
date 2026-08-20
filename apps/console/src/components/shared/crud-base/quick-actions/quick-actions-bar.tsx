'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import Menu from '@/components/shared/menu/menu'
import { MoreHorizontal } from 'lucide-react'

export type QuickActionItem = {
  id: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
}

type QuickActionsBarProps = {
  actions: QuickActionItem[]
  renderAction: (action: QuickActionItem, options: { inMenu: boolean }) => React.ReactNode
  label?: string
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ actions, renderAction, label = 'Quick Actions' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState<number | null>(null)
  const [measured, setMeasured] = useState(false)
  const lastWidthRef = useRef<number>(0)

  useEffect(() => {
    lastWidthRef.current = 0

    const calculateVisibleItems = () => {
      if (!containerRef.current || !measureRef.current) return

      const containerWidth = containerRef.current.offsetWidth
      if (containerWidth === 0) return

      if (Math.abs(containerWidth - lastWidthRef.current) < 5) return
      lastWidthRef.current = containerWidth

      const measureChildren = Array.from(measureRef.current.children) as HTMLElement[]
      if (measureChildren.length === 0) return

      const moreButtonWidth = 40
      const gap = 8
      let totalWidth = 0
      let count = 0

      for (const child of measureChildren) {
        const childWidth = child.offsetWidth + gap
        if (totalWidth + childWidth + moreButtonWidth > containerWidth && count > 0) {
          break
        }
        totalWidth += childWidth
        count++
      }

      const allItemsWidth = measureChildren.reduce((sum, child) => sum + child.offsetWidth + gap, 0) - gap
      if (allItemsWidth <= containerWidth) {
        setVisibleCount(null)
      } else {
        setVisibleCount(Math.max(1, count))
      }
      setMeasured(true)
    }

    calculateVisibleItems()
    const timer = setTimeout(calculateVisibleItems, 0)

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(calculateVisibleItems)
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
    }
  }, [actions])

  const showAll = visibleCount === null
  const visibleActions = showAll ? actions : actions.slice(0, visibleCount)
  const overflowActions = showAll ? [] : actions.slice(visibleCount)

  return (
    <div className="relative space-y-3">
      <p className="text-sm text-muted-foreground">{label}</p>

      <div ref={measureRef} className="flex w-max max-w-none gap-2 invisible absolute left-0 top-0 pointer-events-none" aria-hidden="true">
        {actions.map((action) => (
          <Button key={action.id} type="button" variant="secondary" className="h-8 px-3 shrink-0 whitespace-nowrap" icon={action.icon} iconPosition="left">
            {action.label}
          </Button>
        ))}
      </div>

      <div ref={containerRef} className={`flex flex-nowrap gap-2 items-center overflow-hidden [&>*]:shrink-0 ${measured ? '' : 'invisible'}`}>
        {visibleActions.map((action) => renderAction(action, { inMenu: false }))}

        {overflowActions.length > 0 && (
          <Menu
            trigger={
              <Button type="button" variant="secondary" className="h-8 px-2">
                <span className="sr-only">More quick actions</span>
                <MoreHorizontal size={16} />
              </Button>
            }
            content={<>{overflowActions.map((action) => renderAction(action, { inMenu: true }))}</>}
          />
        )}
      </div>
    </div>
  )
}

export default QuickActionsBar
