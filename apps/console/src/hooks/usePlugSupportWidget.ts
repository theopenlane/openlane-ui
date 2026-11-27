'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { PlugWidgetView } from '@/types/global'

let plugWidgetReady = false
const listeners = new Set<() => void>()

export const setPlugWidgetReady = (ready: boolean) => {
  if (plugWidgetReady === ready) return
  plugWidgetReady = ready
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => plugWidgetReady && typeof window.plugSDK?.toggleWidget === 'function'
const getServerSnapshot = () => false

export const usePlugSupportWidget = (view?: PlugWidgetView) => {
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const openSupport = useCallback(() => window.plugSDK?.toggleWidget?.(true, view), [view])
  return ready ? openSupport : undefined
}
