import { useEffect, useState } from 'react'

export const useShortcutSuffix = () => {
  const sign = '/'
  const [suffix, setSuffix] = useState('Ctrl')

  useEffect(() => {
    const isMac = typeof window !== 'undefined' && navigator.userAgent.toUpperCase().includes('MAC')
    setSuffix(isMac ? '⌘' : 'Ctrl')
  }, [])

  return {
    fullSuffix: `${suffix} ${sign}`,
    suffix: suffix,
    sign,
  }
}
