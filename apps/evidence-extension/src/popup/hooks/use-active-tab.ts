import { useEffect, useState } from 'react'
import type { TCaptureTarget } from '../../lib/capture'

const CAPTURABLE_PROTOCOLS = new Set(['http:', 'https:'])

type TActiveTabState = { status: 'loading' } | { status: 'unsupported'; reason: string } | { status: 'ready'; target: TCaptureTarget }

const toCaptureTarget = (tab: chrome.tabs.Tab | undefined): TActiveTabState => {
  if (!tab?.url || tab.windowId === undefined) {
    return { status: 'unsupported', reason: 'Open the page you want to capture, then open the extension again.' }
  }
  const url = new URL(tab.url)
  if (!CAPTURABLE_PROTOCOLS.has(url.protocol)) {
    return { status: 'unsupported', reason: 'Browser and extension pages cannot be captured. Open a website to capture it.' }
  }
  return { status: 'ready', target: { windowId: tab.windowId, url, title: tab.title ?? url.hostname } }
}

export const useActiveTab = () => {
  const [state, setState] = useState<TActiveTabState>({ status: 'loading' })

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(
      ([tab]) => setState(toCaptureTarget(tab)),
      () => setState({ status: 'unsupported', reason: 'The current tab could not be read.' }),
    )
  }, [])

  return state
}
