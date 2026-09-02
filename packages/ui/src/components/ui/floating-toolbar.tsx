'use client'

import * as React from 'react'

import { type FloatingToolbarState, flip, offset, useFloatingToolbar, useFloatingToolbarState } from '@platejs/floating'

import { KEYS } from 'platejs'
import { useEditorId, useEditorRef, useEventEditorValue, usePluginOption } from 'platejs/react'

import { cn } from '@repo/ui/lib/utils'

import { Toolbar } from './toolbar'
import { useComposedRef } from 'platejs/react'

const EDGE_GAP = 12

const getScrollParent = (node: HTMLElement): HTMLElement | null => {
  let current = node.parentElement

  while (current) {
    const { overflowY } = getComputedStyle(current)

    if (overflowY === 'auto' || overflowY === 'scroll') return current

    current = current.parentElement
  }

  return null
}

type PinnedToolbarCollision = {
  boundary: HTMLElement[]
  paddingTop: number
}

export function FloatingToolbar({
  children,
  className,
  state,
  ...props
}: React.ComponentProps<typeof Toolbar> & {
  state?: FloatingToolbarState
}) {
  const editor = useEditorRef()
  const editorId = useEditorId()
  const focusedEditorId = useEventEditorValue('focus')
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode')
  const isAIChatOpen = usePluginOption({ key: KEYS.aiChat }, 'open')
  const [collision, setCollision] = React.useState<PinnedToolbarCollision | null>(null)

  React.useEffect(() => {
    const container = editor.api.toDOMNode(editor)?.closest<HTMLElement>('[data-slot="editor-container"]')
    const pinnedToolbar = container?.querySelector<HTMLElement>('[data-slot="fixed-toolbar"]')

    if (!container || !pinnedToolbar) return

    const scrollParent = getScrollParent(container)
    const boundary = scrollParent ? [container, scrollParent] : [container]
    const measure = () => setCollision({ boundary, paddingTop: pinnedToolbar.offsetHeight + EDGE_GAP })
    const observer = new ResizeObserver(measure)

    observer.observe(pinnedToolbar)
    measure()

    return () => observer.disconnect()
  }, [editor])

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar: isFloatingLinkOpen || isAIChatOpen,
    ...state,
    floatingOptions: {
      middleware: [
        offset(EDGE_GAP),
        flip({
          boundary: collision?.boundary,
          fallbackPlacements: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
          padding: collision ? { bottom: EDGE_GAP, left: EDGE_GAP, right: EDGE_GAP, top: collision.paddingTop } : EDGE_GAP,
        }),
      ],
      placement: 'top',
      ...state?.floatingOptions,
    },
  })

  const { clickOutsideRef, hidden, props: rootProps, ref: floatingRef } = useFloatingToolbar(floatingToolbarState)

  const ref = useComposedRef<HTMLDivElement>(props.ref, floatingRef)

  if (hidden) return null

  return (
    <div ref={clickOutsideRef}>
      <Toolbar
        {...props}
        {...rootProps}
        ref={ref}
        className={cn(
          'absolute z-(--editor-z-floating-toolbar) scrollbar-hide overflow-x-auto rounded-md border bg-popover p-1 whitespace-nowrap opacity-100 shadow-md print:hidden',
          'max-w-[80vw]',
          className,
        )}
      >
        {children}
      </Toolbar>
    </div>
  )
}
