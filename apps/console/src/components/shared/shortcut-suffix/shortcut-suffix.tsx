import { useState } from 'react'

export const useShortcutSuffix = () => {
  const sign = '/'
  const [suffix] = useState(() => {
    const isMac = typeof window !== 'undefined' && navigator.userAgent.toUpperCase().includes('MAC')
    return isMac ? '⌘' : 'Ctrl'
  })

  return {
    fullSuffix: `${suffix} ${sign}`,
    suffix: suffix,
    sign,
  }
}
